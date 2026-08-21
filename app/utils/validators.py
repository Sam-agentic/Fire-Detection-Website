from fastapi import UploadFile, HTTPException
from app import config
import imghdr

def validate_file_extension(filename: str, allowed_types: list):
    """
    Check karta hai file ka extension allowed list mein hai ya nahi.
    Example: 'photo.jpg' -> extension 'jpg' -> allowed_types mein hai to OK
    """
    if "." not in filename:
        raise HTTPException(status_code=400, detail="File ka koi extension nahi mila.")

    extension = filename.rsplit(".", 1)[1].lower()

    if extension not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Ye file type allowed nahi hai. Sirf ye allowed hain: {', '.join(allowed_types)}"
        )
    return extension


async def validate_file_size(file: UploadFile):
    """
    File ka actual size check karta hai (limit se zyada na ho).
    """
    # File ko poora padh kar size check karte hain
    file.file.seek(0, 2)   # file ke aakhir mein jao
    size = file.file.tell()  # current position = total size
    file.file.seek(0)   # wapis shuru mein aa jao (taake baad mein file dobara padhi ja sake)

    if size > config.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File bohot badi hai. Maximum allowed size: {config.MAX_FILE_SIZE_MB}MB"
        )
    return size


def validate_image_content(file_path: str):
    """
    Sirf extension check karna kaafi nahi — hum actual file content
    bhi verify karte hain ke ye waqai ek image hai.
    Ye hackers ko is trick se rokta hai: 'malware.exe' ko 'photo.jpg' naam de dena.
    """
    detected_type = imghdr.what(file_path)
    if detected_type is None:
        raise HTTPException(
            status_code=400,
            detail="Ye file asal mein ek valid image nahi hai (content check fail hua)."
        )
    return True