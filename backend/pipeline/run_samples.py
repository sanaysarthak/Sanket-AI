import cv2
import os
import sys
from datetime import datetime
from pipeline.core import UrbanPipeline

def process_video(video_path):
    print(f"\nProcessing: {video_path}")
    pipeline = UrbanPipeline(source=video_path)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open {video_path}")
        return

    frame_idx = 0
    # Process every Nth frame to speed up
    skip_frames = 10 
    max_frames = 300 # Limit to 300 frames for quick check
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_idx += 1
        if frame_idx > max_frames:
            print(f"Reached max frames ({max_frames}) for preview.")
            break

        if frame_idx % skip_frames != 0:
            continue
            
        # Resize for speed (YOLOv8n is optimized for 640)
        height, width = frame.shape[:2]
        new_width = 640
        new_height = int(height * (new_width / width))
        frame_resized = cv2.resize(frame, (new_width, new_height))
            
        # Layer 1: Vision
        vision_output = pipeline.vision.process_frame(frame_resized)
        
        # Layer 2: Behavior
        metrics = pipeline.behavior.update(vision_output)
        
        # Layer 3: Event
        if metrics:
            event = pipeline.classifier.classify(metrics)
            
            # Log significant events or periodic status
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Frame {frame_idx}: {event['type']} "
                  f"(Conf: {event['confidence']}, Density: {metrics['crowd_density']:.2f})")

    cap.release()
    print(f"Finished {video_path}")

def main():
    example_dir = os.path.join(os.getcwd(), 'example')
    if not os.path.exists(example_dir):
        print(f"Directory not found: {example_dir}")
        return

    video_files = [f for f in os.listdir(example_dir) if f.endswith(('.mp4', '.avi', '.mov'))]
    
    if not video_files:
        print("No video files found in example directory.")
        return

    print(f"Found {len(video_files)} videos. Starting processing...")
    
    for video_file in video_files:
        full_path = os.path.join(example_dir, video_file)
        try:
            process_video(full_path)
        except Exception as e:
            print(f"Failed to process {video_file}: {e}")

if __name__ == "__main__":
    main()
