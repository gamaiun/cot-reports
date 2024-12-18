# Use the official Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8080 (required for Cloud Run)
EXPOSE 8080

# Start the Flask application
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]