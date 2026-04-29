from pydantic import BaseModel

class BoundingBox(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float