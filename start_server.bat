@echo off
echo Starting Flask server with TensorFlow...
echo.
echo Note: You may see TensorFlow optimization messages - these are normal.
echo The server will be accessible on your local network.
echo.
set TF_CPP_MIN_LOG_LEVEL=2
python main.py 