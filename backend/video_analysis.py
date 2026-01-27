from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
import shutil
import os
import cv2
import json
from datetime import timedelta
import tempfile
from .pipeline.core import UrbanPipeline

router = APIRouter()

# Global store for demo purposes (in-memory)
PROCESSED_VIDEOS = {}

def process_video_task(video_path: str, task_id: str, output_path: str):
    """
    Runs the UrbanPipeline on the video in the background.
    """
    try:
        pipeline = UrbanPipeline(source=video_path)
        cap = cv2.VideoCapture(video_path)
        
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        
        # Use appropriate codec
        try:
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
        except:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        metadata_log = []
        frame_idx = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_idx += 1
            
            # Run Pipeline
            pipeline_out = pipeline.process_frame(frame, frame_idx)
            
            # Annotate
            annotated_frame = pipeline.annotator.annotate(frame, pipeline_out)
            out.write(annotated_frame)
            
            # Log Metadata (Sample every 1 sec)
            if frame_idx % int(fps) == 0:
                metrics = pipeline_out['metrics']
                event = pipeline_out['events']['primary_event']
                metadata_log.append({
                    "timestamp_sec": frame_idx / fps,
                    "frame": frame_idx,
                    "event": event,
                    "crowd_count": metrics['crowd_count'],
                    "vehicle_count": metrics['vehicle_count'],
                    "avg_speed": metrics.get('avg_speed', 0)
                })

        cap.release()
        out.release()
        
        PROCESSED_VIDEOS[task_id] = {
            "status": "completed",
            "output_path": output_path,
            "metadata": metadata_log
        }
        
    except Exception as e:
        print(f"Error processing video {task_id}: {e}")
        PROCESSED_VIDEOS[task_id] = {"status": "failed", "error": str(e)}

@router.post("/analyze/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a video for analysis. Returns a task ID.
    PROCESSED_VIDEOS
    """
    task_id = f"task_{len(PROCESSED_VIDEOS) + 1}"
    
    # Save to temp
    temp_dir = tempfile.gettempdir()
    input_path = os.path.join(temp_dir, f"{task_id}_input.mp4")
    output_path = os.path.join(temp_dir, f"{task_id}_output.mp4")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    PROCESSED_VIDEOS[task_id] = {"status": "processing"}
    
    # Start background processing
    background_tasks.add_task(process_video_task, input_path, task_id, output_path)
    
    return {"task_id": task_id, "status": "processing", "message": "Video upload successful. Processing started."}

@router.get("/analyze/status/{task_id}")
def get_status(task_id: str):
    """
    Check status of analysis.
    """
    if task_id not in PROCESSED_VIDEOS:
        return JSONResponse(status_code=404, content={"error": "Task not found"})
    
    task = PROCESSED_VIDEOS[task_id]
    if task["status"] == "completed":
        return {
            "status": "completed",
            "metadata": task["metadata"]
        }
    return {"status": task["status"]}

@router.get("/analyze/video/{task_id}")
def get_video_stream(task_id: str):
    """
    Stream the processed video.
    """
    if task_id not in PROCESSED_VIDEOS:
        return JSONResponse(status_code=404, content={"error": "Task not found"})
        
    task = PROCESSED_VIDEOS[task_id]
    if task["status"] != "completed":
        return JSONResponse(status_code=400, content={"error": "Processing not pending or failed"})
        
    return FileResponse(task["output_path"], media_type="video/mp4")
