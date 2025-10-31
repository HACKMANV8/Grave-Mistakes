"""
VynceAI Backend - Command Routes
Endpoints for browser command execution and automation
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import CommandRequest, CommandResponse
from app.services.command_service import (
    execute_command,
    validate_command,
    get_supported_commands
)
from app.core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.post("/run", response_model=CommandResponse)
async def run_command(req: CommandRequest):
    """
    Execute browser command
    
    Args:
        req: CommandRequest with command name and optional parameters
        
    Returns:
        CommandResponse with execution result
    """
    logger.info(f"Command execution request: {req.command}")
    
    try:
        # Validate command
        is_valid = await validate_command(req.command)
        
        if not is_valid:
            logger.warning(f"Invalid command: {req.command}")
            supported = await get_supported_commands()
            return CommandResponse(
                result=f"Invalid command: {req.command}",
                success=False,
                error=f"Supported commands: {', '.join(supported)}"
            )
        
        # Execute command
        result = await execute_command(req.command, req.params)
        logger.info(f"Command executed successfully: {req.command}")
        
        return CommandResponse(
            result=result,
            success=True,
            error=None
        )
    
    except Exception as e:
        logger.error(f"Error executing command {req.command}: {str(e)}")
        return CommandResponse(
            result="Command execution failed",
            success=False,
            error=str(e)
        )

@router.get("/commands")
async def list_commands():
    """
    Get list of supported commands
    
    Returns:
        List of supported command names
    """
    logger.info("Fetching supported commands")
    
    try:
        commands = await get_supported_commands()
        return {
            "commands": commands,
            "count": len(commands)
        }
    
    except Exception as e:
        logger.error(f"Error fetching commands: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate")
async def validate_command_endpoint(command: str):
    """
    Validate if a command is supported
    
    Args:
        command: Command name to validate
        
    Returns:
        Validation result
    """
    logger.info(f"Validating command: {command}")
    
    is_valid = await validate_command(command)
    
    return {
        "command": command,
        "valid": is_valid,
        "message": "Command is supported" if is_valid else "Command is not supported"
    }
