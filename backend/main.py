from fastapi import FastAPI
from app.routes import router
from starlette.requests import Request
from starlette.responses import Response

app = FastAPI()
app.include_router(router)

@functions_framework.http
def stray_dog_mapper(request):
    """
    Cloud Run entrypoint for FastAPI app using functions_framework.
    """
    # Convert Flask request to ASGI request
    asgi_request = Request(request.environ)
    response = Response()
    return app(asgi_request.scope, asgi_request.receive, response.send)