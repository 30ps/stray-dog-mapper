
import functions_framework
from fastapi import FastAPI
from mangum import Mangum
from app.routes import router

app = FastAPI()
app.include_router(router)

handler = Mangum(app)

@functions_framework.http
def stray_dog_mapper(request):
    """
    Cloud Run entrypoint for FastAPI app using functions_framework and Mangum.
    """
    return handler(request)
