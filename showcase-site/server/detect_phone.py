# detect_phone.py
import cv2
import sys
import json
import numpy as np

def detect_phone():
    # Initialize the webcam feed
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        return json.dumps({"error": "Could not access webcam"})

    while True:
        # Read frame from webcam
        ret, frame = cap.read()
        
        if not ret:
            continue

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Apply Threshold to detect bright objects (like phone screens)
        _, thresholded = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)

        # Find contours
        contours, _ = cv2.findContours(thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Check if a phone is detected based on size of contour
        phone_detected = any(cv2.contourArea(contour) > 5000 for contour in contours)

        # Prepare result
        result = json.dumps({"phoneDetected": phone_detected})
        print(result)
        sys.stdout.flush()

        # Display the frame for debugging purposes
        cv2.imshow("Study Watcher", frame)

        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the webcam and close the OpenCV window
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    detect_phone()
