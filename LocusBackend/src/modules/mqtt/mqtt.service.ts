/**
 * MQTT Service
 * 엣지 디바이스와 MQTT를 통해 실시간 통신합니다.
 */

import mqtt from 'mqtt';
import { prisma } from '../../config/db';

// MQTT 클라이언트 설정
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

let client: mqtt.MqttClient | null = null;

/**
 * MQTT Broker에 연결합니다.
 */
export function connectMQTT(): void {
  if (client) {
    console.log('[MQTT] Already connected');
    return;
  }

  client = mqtt.connect(MQTT_BROKER_URL);

  client.on('connect', () => {
    console.log('[MQTT] Connected to broker:', MQTT_BROKER_URL);

    // 엣지 디바이스로부터 메시지 구독
    client!.subscribe('home/+/prediction/pollution', (err) => {
      if (err) {
        console.error('[MQTT] Failed to subscribe to pollution predictions:', err);
      } else {
        console.log('[MQTT] Subscribed to: home/+/prediction/pollution');
      }
    });

    client!.subscribe('home/+/cleaning/#', (err) => {
      if (err) {
        console.error('[MQTT] Failed to subscribe to cleaning events:', err);
      } else {
        console.log('[MQTT] Subscribed to: home/+/cleaning/#');
      }
    });

    client!.subscribe('edge/+/status', (err) => {
      if (err) {
        console.error('[MQTT] Failed to subscribe to device status:', err);
      } else {
        console.log('[MQTT] Subscribed to: edge/+/status');
      }
    });
  });

  client.on('message', handleMessage);

  client.on('error', (err) => {
    console.error('[MQTT] Connection error:', err);
  });

  client.on('close', () => {
    console.log('[MQTT] Connection closed');
  });
}

/**
 * MQTT 메시지 처리
 */
async function handleMessage(topic: string, message: Buffer): Promise<void> {
  try {
    const data = JSON.parse(message.toString());
    console.log('[MQTT] Message received:', topic);

    // 오염도 예측 저장
    if (topic.includes('/prediction/pollution')) {
      await handlePollutionPrediction(topic, data);
    }

    // 청소 결과 저장
    else if (topic.includes('/cleaning/result')) {
      await handleCleaningResult(topic, data);
    }

    // 청소 상태 (실시간 - DB 저장 안 함)
    else if (topic.includes('/cleaning/status')) {
      console.log('[MQTT] Cleaning status update:', data);
      // 실시간 상태는 DB에 저장하지 않고, 앱으로 전달만 함
    }

    // 디바이스 상태
    else if (topic.includes('/status')) {
      console.log('[MQTT] Device status update:', data);
      // 디바이스 상태 업데이트 로직 추가 가능
    }
  } catch (error) {
    console.error('[MQTT] Error processing message:', error);
  }
}

/**
 * 오염도 예측을 DB에 저장
 */
async function handlePollutionPrediction(topic: string, data: any): Promise<void> {
  try {
    const homeId = extractHomeIdFromTopic(topic);
    if (!homeId) {
      console.error('[MQTT] Cannot extract homeId from topic:', topic);
      return;
    }

    const predictions = data.predictions || {};
    const deviceIdFromMessage = data.device_id;

    // 해당 home의 디바이스 조회 (없으면 첫 번째 디바이스 사용)
    const device = await prisma.device.findFirst({
      where: { homeId: parseInt(homeId) },
    });

    if (!device) {
      console.error('[MQTT] No device found for home:', homeId);
      return;
    }

    // 각 구역별로 예측 저장
    for (const [zoneName, probability] of Object.entries(predictions)) {
      // 구역 ID 조회
      const label = await prisma.roomLabel.findFirst({
        where: {
          homeId: parseInt(homeId),
          name: zoneName,
        },
      });

      if (!label) {
        console.warn('[MQTT] Zone not found:', zoneName, 'for home:', homeId);
        continue;
      }

      // PollutionPrediction 저장
      await prisma.pollutionPrediction.create({
        data: {
          homeId: parseInt(homeId),
          deviceId: device.id,
          labelId: label.id,
          probability: probability as number,
          modelVersion: 'gru-v1',
          predictionTime: new Date(),
        },
      });
    }

    console.log('[MQTT] Pollution predictions saved for home:', homeId, 'zones:', Object.keys(predictions).length);
  } catch (error) {
    console.error('[MQTT] Error saving pollution prediction:', error);
  }
}

/**
 * 청소 결과를 DB에 저장
 */
async function handleCleaningResult(topic: string, data: any): Promise<void> {
  try {
    const homeId = extractHomeIdFromTopic(topic);
    if (!homeId) {
      console.error('[MQTT] Cannot extract homeId from topic:', topic);
      return;
    }

    const zoneName = data.zone;
    const duration = data.duration_seconds;

    // 구역 ID 조회
    const label = await prisma.roomLabel.findFirst({
      where: {
        homeId: parseInt(homeId),
        name: zoneName,
      },
    });

    // SensorEvent로 청소 완료 이벤트 저장
    await prisma.sensorEvent.create({
      data: {
        homeId: parseInt(homeId),
        eventType: 'SYSTEM',
        subType: 'CLEANING_COMPLETED',
        eventTime: new Date(data.timestamp),
        labelId: label?.id || null,
        payloadJson: {
          zone: zoneName,
          duration_seconds: duration,
        },
      },
    });

    console.log('[MQTT] Cleaning result saved for zone:', zoneName);
  } catch (error) {
    console.error('[MQTT] Error saving cleaning result:', error);
  }
}

/**
 * Topic에서 homeId 추출
 * 예: home/123/zones/update -> 123
 */
function extractHomeIdFromTopic(topic: string): string | null {
  const match = topic.match(/home\/([^\/]+)\//);
  return match ? match[1] : null;
}

/**
 * 구역 변경을 엣지 디바이스에 알립니다.
 */
export async function notifyZoneUpdate(homeId: string): Promise<void> {
  if (!client) {
    console.error('[MQTT] Client not connected');
    return;
  }

  try {
    // 해당 집의 모든 구역 조회
    const zones = await prisma.roomLabel.findMany({
      where: { homeId: parseInt(homeId) },
      include: {
        points: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    const payload = {
      homeId,
      zones: zones.map((zone) => ({
        id: zone.id.toString(),
        name: zone.name,
        points: zone.points.map((p) => ({ x: p.x, z: p.z })),
      })),
      timestamp: new Date().toISOString(),
    };

    const topic = `home/${homeId}/zones/update`;
    client.publish(topic, JSON.stringify(payload), { qos: 1 });

    console.log('[MQTT] Zone update published to:', topic);
  } catch (error) {
    console.error('[MQTT] Error publishing zone update:', error);
  }
}

/**
 * MQTT 연결 종료
 */
export function disconnectMQTT(): void {
  if (client) {
    client.end();
    client = null;
    console.log('[MQTT] Disconnected');
  }
}
