from pydantic import BaseModel

class SearchMotorDataRequest(BaseModel):
    Nsb : float
    Pct : float
    