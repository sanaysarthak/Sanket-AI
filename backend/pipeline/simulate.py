import time
import random
import numpy as np
from pipeline.core import BehavioralAnalyzer, EventClassifier

class MockVisionEngine:
    """
    Simulates Layer 1 output (Vision Primitives) to test Layers 2 & 3.
    Generates synthetic detections based on requested scenarios.
    """
    def __init__(self):
        self.frame_width = 1920
        self.frame_height = 1080
        
    def generate_frame_data(self, timestamp, scenario="normal", frame_idx=0):
        """
        Generates a list of detections based on the scenario.
        """
        detections = []
        
        # Scenario parameters
        num_people = 10
        avg_speed = 2.0
        chaos_factor = 0.1 # Low entropy
        
        # Dynamic changes based on frame_idx (simulate time evolution)
        if scenario == "crowd_surge":
            num_people = 10 + int(frame_idx * 0.5) # Increasing crowd
            if num_people > 250: num_people = 250
            
        elif scenario == "panic":
            num_people = 50
            avg_speed = 25.0 # High speed
            chaos_factor = 10.0 # High entropy
            
        elif scenario == "congestion":
            num_people = 150
            avg_speed = 0.5 # Low speed
            chaos_factor = 0.1
            
        elif scenario == "loitering":
            num_people = 5
            avg_speed = 0.1 # Static
            
        elif scenario == "stampede":
            num_people = 250 # Critical density
            avg_speed = 20.0 # High speed
            chaos_factor = 10.0 # High entropy
            
        elif scenario == "corridor_blocked":
            num_people = 10
            avg_speed = 2.0
            # We will handle the metric injection in the runner loop
            
        # Generate individual detections
        for i in range(num_people):
            # Random position
            x = random.randint(0, self.frame_width)
            y = random.randint(0, self.frame_height)
            
            # Velocity vector
            vx = random.gauss(avg_speed, avg_speed * 0.1)
            vy = random.gauss(avg_speed, avg_speed * 0.1)
            
            # Apply chaos (random direction changes)
            if chaos_factor > 1.0:
                vx = random.uniform(-avg_speed, avg_speed)
                vy = random.uniform(-avg_speed, avg_speed)
            
            # Determine class_id
            class_id = 0 # Person
            if scenario == "congestion":
                class_id = 2 # Car
                
            detections.append({
                'track_id': i, # Simple persistent IDs
                'class_id': class_id, 
                'centroid': (x, y),
                'velocity': (vx, vy),
                'bbox': (x, y, x+50, y+100)
            })
            
        return {
            "timestamp": timestamp,
            "detections": detections
        }

def run_test_scenario(scenario_name, duration_frames=100):
    print(f"\n--- Running Scenario: {scenario_name} ---")
    
    mock_vision = MockVisionEngine()
    behavior = BehavioralAnalyzer(window_seconds=5) # Short window for testing
    classifier = EventClassifier()
    
    start_time = time.time()
    
    for i in range(duration_frames):
        current_time = start_time + (i * 0.1) # Simulate 10 FPS
        
        # 1. Generate Synthetic Data
        vision_output = mock_vision.generate_frame_data(current_time, scenario=scenario_name, frame_idx=i)
        
        # 2. Analyze Behavior
        metrics = behavior.update(vision_output)
        
        # Inject mock metrics for specific scenarios that VisionEngine doesn't simulate natively
        if scenario_name == "corridor_blocked":
            metrics['corridor_blocked'] = True
        
        # 3. Classify Event
        if metrics:
            event = classifier.classify(metrics)
            
            # Print status every 10 frames
            if i % 10 == 0:
                print(f"Frame {i:3d} | People: {int(metrics['crowd_count']):3d} | "
                      f"Speed: {metrics['avg_speed']:5.1f} | Entropy: {metrics['movement_entropy']:5.1f} | "
                      f"Event: {event['type']} ({event['confidence']})")

if __name__ == "__main__":
    # Test 1: Normal Activity
    run_test_scenario("normal")
    
    # Test 2: Crowd Surge (Rising density)
    run_test_scenario("crowd_surge")
    
    # Test 3: Panic (High speed + entropy)
    run_test_scenario("panic")
    
    # Test 4: Stampede Risk (Critical Density + Panic)
    # We need to simulate high density AND high chaos
    run_test_scenario("stampede")

    # Test 5: Congestion (High density + low speed)
    run_test_scenario("congestion")

    # Test 6: Loitering (High dwell time)
    run_test_scenario("loitering")
    
    # Test 7: Emergency Corridor Blocked
    run_test_scenario("corridor_blocked")
