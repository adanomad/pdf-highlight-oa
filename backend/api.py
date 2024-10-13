from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from image_search import run_image_search
import shutil
import os
import uuid
import numpy as np

app = FastAPI()

def make_serializable(results):
    serializable_results = []
    for idx, similarity in results:
        if isinstance(similarity, np.floating):
            similarity = float(similarity)
        serializable_results.append((idx, similarity))
    return serializable_results

@app.post("/search_images")
async def search_images(search_term: str = Form(...), pdf_file: UploadFile = File(...)):
    try:
        # Save the uploaded PDF file to a temporary location
        temp_filename = f"/tmp/{uuid.uuid4()}_{pdf_file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(pdf_file.file, buffer)

        # Run the image search
        results, _ = run_image_search(search_term, temp_filename)

        # Clean up the temporary PDF file
        os.remove(temp_filename)

        # Ensure results are JSON-serializable
        results = make_serializable(results)

        # Return the results
        return {"results": results}
    except Exception as e:
        # Log the exception
        print(f"An error occurred: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})
