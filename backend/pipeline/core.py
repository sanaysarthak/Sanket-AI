import cv2
import numpy as np
from collections import deque, defaultdict
from datetime import datetime
import math

# --- Layer 1: Vision Primitives ---
class VisionEngine:
    def __init__(self, model_path='yolov8n.pt'):
        from ultralytics import YOLO  # deferred: torch is heavy, only load when a video is actually processed
        self.model = YOLO(model_path)
        # Classes: 0:Person, 2:Car, 3:Motorcycle, 5:Bus, 7:Truck
        self.target_classes = [0, 2, 3, 5, 7] 

    def process_frame(self, frame):
        results = self.model.track(frame, persist=True, verbose=False, classes=self.target_classes)
        
        detections = []
        if results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.int().cpu().numpy()
            class_ids = results[0].boxes.cls.int().cpu().numpy()
            confs = results[0].boxes.conf.cpu().numpy()

            for box, track_id, cls_id, conf in zip(boxes, track_ids, class_ids, confs):
                x1, y1, x2, y2 = map(int, box)
                detections.append({
                    "track_id": int(track_id),
                    "class_id": int(cls_id),
                    "bbox": (x1, y1, x2, y2),
                    "confidence": float(conf),
                    "center": ((x1 + x2) // 2, (y1 + y2) // 2)
                })
        
        return {"detections": detections, "raw_results": results}

# --- Layer 2: Face Detection & Matching (Simulated/Haar) ---
class FaceSystem:
    def __init__(self):
        # Fallback to Haar Cascade since dlib failed
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.detector = cv2.CascadeClassifier(cascade_path)
        # Mock database for "Closed-Set" matching
        self.known_faces = {
            "subject_01": {"color_hist": None}, # Placeholder
        }

    def process(self, frame, person_detections):
        """
        Detects faces. If a face is inside a 'person' bbox, associate it.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        results = []
        for (x, y, w, h) in faces:
            face_data = {
                "bbox": (x, y, x+w, y+h),
                "face_id": "unknown", # Default
                "confidence": 0.85 # Mock confidence for Haar
            }
            # Simple heuristic: Match to Person ID if contained
            # (Logic omitted for brevity, can be added if needed)
            results.append(face_data)
            
        return results

# --- Layer 3: ANPR ---
class ANPRSystem:
    def __init__(self):
        import easyocr
        self.reader = easyocr.Reader(['en'], gpu=False)

    def process(self, frame, vehicle_detections):
        results = []
        for d in vehicle_detections:
            # Only check large vehicles to save compute
            x1, y1, x2, y2 = d['bbox']
            if (x2 - x1) * (y2 - y1) < 5000: continue 

            plate_text = self._detect_text(frame, (x1, y1, x2, y2))
            if plate_text:
                results.append({
                    "vehicle_id": d['track_id'],
                    "plate_text": plate_text,
                    "confidence": 0.9 # Mock confidence
                })
        return results

    def _detect_text(self, frame, bbox):
        x1, y1, x2, y2 = bbox
        h, w = frame.shape[:2]
        crop = frame[max(0,y1):min(h,y2), max(0,x1):min(w,x2)]
        try:
            res = self.reader.readtext(crop)
            for (_, text, conf) in res:
                if conf > 0.3 and len(text) > 4 and any(c.isdigit() for c in text):
                    return text.upper()
        except:
            pass
        return None

# --- Layer 4: Behavior Analysis ---
class BehavioralAnalyzer:
    def __init__(self, window_size=30):
        self.history = defaultdict(lambda: deque(maxlen=window_size))
        self.window_size = window_size

    def update(self, detections):
        # Update history
        current_ids = set()
        for d in detections:
            tid = d['track_id']
            current_ids.add(tid)
            self.history[tid].append(d['center'])

        # Cleanup lost tracks
        for tid in list(self.history.keys()):
            if tid not in current_ids:
                del self.history[tid]

        # Calculate Metrics
        metrics = {
            "crowd_count": len([d for d in detections if d['class_id'] == 0]),
            "vehicle_count": len([d for d in detections if d['class_id'] in [2,3,5,7]]),
            "avg_speed": self._calculate_avg_speed(),
            "entropy": self._calculate_entropy(detections),
            "stationary_count": self._calculate_stationary_count()
        }
        return metrics

    def _calculate_avg_speed(self):
        speeds = []
        for tid, points in self.history.items():
            if len(points) < 2: continue
            dist = math.hypot(points[-1][0] - points[-2][0], points[-1][1] - points[-2][1])
            speeds.append(dist)
        return np.mean(speeds) if speeds else 0.0

    def _calculate_entropy(self, detections):
        # Directional Entropy: measure of disorder in movement directions
        directions = []
        for tid, points in self.history.items():
            if len(points) < 5: continue
            dx = points[-1][0] - points[-5][0]
            dy = points[-1][1] - points[-5][1]
            angle = math.atan2(dy, dx)
            directions.append(angle)
        
        if not directions: return 0.0
        
        # Histogram of angles (8 bins)
        hist, _ = np.histogram(directions, bins=8, range=(-math.pi, math.pi))
        probs = hist / len(directions)
        entropy = -sum(p * math.log2(p) for p in probs if p > 0)
        return entropy

    def _calculate_stationary_count(self):
        count = 0
        for tid, points in self.history.items():
            if len(points) > 20:
                # Check displacement over last 20 frames
                dist = math.hypot(points[-1][0] - points[0][0], points[-1][1] - points[0][1])
                if dist < 20: # Threshold for "stationary"
                    count += 1
        return count

# --- Layer 5 & 6: Events & Accidents ---
class EventEngine:
    def __init__(self):
        self.incident_cooldown = 0

    def classify(self, metrics, detections):
        events = []
        incident = None

        # 1. Crowd Events
        if metrics['crowd_count'] > 20:
            events.append("crowd_density_high")
        if metrics['entropy'] > 2.0 and metrics['avg_speed'] > 5.0:
            events.append("panic_movement_detected")
        if metrics['stationary_count'] > 5 and metrics['crowd_count'] > 10:
            events.append("loitering_detected")
        if metrics['vehicle_count'] > 5 and metrics['avg_speed'] < 1.0:
            events.append("vehicle_congestion")

        # 2. Accident/Calamity (Heuristic)
        # Collision: High speed -> Sudden Stop + Overlap (Simplified)
        if metrics['avg_speed'] > 10.0 and metrics['vehicle_count'] > 1:
             # This is a very rough heuristic for simulation
             pass 
        
        # Default
        if not events:
            events.append("normal_activity")

        return {
            "primary_event": events[0],
            "all_events": events,
            "incident": incident
        }

# --- Main Pipeline ---
class UrbanPipeline:
    def __init__(self, source=0):
        self.vision = VisionEngine()
        self.face = FaceSystem()
        self.anpr = ANPRSystem()
        self.behavior = BehavioralAnalyzer()
        self.events = EventEngine()
        self.annotator = Annotator()

    def process_frame(self, frame, frame_idx):
        # Optimization 1: Resize for faster inference
        # Maintain aspect ratio
        h, w = frame.shape[:2]
        scale = 640 / w
        new_h = int(h * scale)
        resized_frame = cv2.resize(frame, (640, new_h))

        # Layer 1 (Vision) - Run on resized frame
        vision_out = self.vision.process_frame(resized_frame)
        
        # Scale detections back to original size
        detections = []
        for d in vision_out['detections']:
            x1, y1, x2, y2 = d['bbox']
            d['bbox'] = (int(x1/scale), int(y1/scale), int(x2/scale), int(y2/scale))
            d['center'] = (int(d['center'][0]/scale), int(d['center'][1]/scale))
            detections.append(d)

        # Layer 2 & 3 (Sub-sampled)
        faces = []
        plates = []
        
        # Optimization 2: Reduce ANPR frequency (Every 30 frames ~ 1 sec)
        if frame_idx % 30 == 0:
            plates = self.anpr.process(frame, [d for d in detections if d['class_id'] in [2,3,5,7]])
        
        # Optimization 3: Reduce Face Detection frequency (Every 10 frames)
        if frame_idx % 10 == 0:
            faces = self.face.process(frame, [d for d in detections if d['class_id']==0])

        # Layer 4
        metrics = self.behavior.update(detections)

        # Layer 5 & 6
        event_result = self.events.classify(metrics, detections)

        return {
            "vision": detections,
            "faces": faces,
            "plates": plates,
            "metrics": metrics,
            "events": event_result
        }

class Annotator:
    def annotate(self, frame, pipeline_out):
        detections = pipeline_out['vision']
        faces = pipeline_out.get('faces', [])
        plates = pipeline_out.get('plates', [])
        event = pipeline_out['events']['primary_event']

        # Draw Detections
        for d in detections:
            x1, y1, x2, y2 = d['bbox']
            color = (0, 255, 0) if d['class_id'] == 0 else (0, 165, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"ID:{d['track_id']}", (x1, y1-5), 0, 0.5, color, 1)

        # Draw Faces
        for f in faces:
            x1, y1, x2, y2 = f['bbox']
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 1)

        # Draw Plates
        for p in plates:
            # Find vehicle to attach label? Or just draw overlay
            cv2.putText(frame, f"PLATE: {p['plate_text']}", (50, 50 + 30*len(plates)), 0, 0.7, (255, 255, 0), 2)

        # Draw Event
        cv2.putText(frame, f"EVENT: {event.upper()}", (20, 30), 0, 1, (0, 0, 255), 2)
        
        return frame
