"""Batch-generate visual novel assets with a GPT image model.

Replace ``OPENAI_BASE_URL`` and ``OPENAI_API_KEY`` before running, or set the
matching environment variables. The script stores scene images and character
images separately, and asks character generations to use transparent
backgrounds. If the target API/model does not support transparent backgrounds,
the script retries with a chroma-green background prompt and optionally removes
that background when Pillow is installed.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, TypedDict, cast


OPENAI_BASE_URL = "https://api.kaopuapi.xyz/v1"
OPENAI_API_KEY = "REPLACE_WITH_YOUR_API_KEY"
IMAGE_MODEL = "gpt-image-2"
OPENAI_ORGANIZATION = ""
OPENAI_PROJECT = ""

OUTPUT_ROOT = Path("public/assets/generated")
REQUEST_TIMEOUT_SECONDS = 240
DEFAULT_MAX_RETRIES = 3
DEFAULT_RETRY_DELAY_SECONDS = 120.0
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)


AssetKind = Literal["scene", "character"]


class ImageApiItem(TypedDict, total=False):
    """Represents one image item from an OpenAI-compatible image response."""

    b64_json: str
    url: str
    revised_prompt: str


class ImageApiResponse(TypedDict, total=False):
    """Represents a minimal OpenAI-compatible image response."""

    data: list[ImageApiItem]


class ImageRequestError(RuntimeError):
    """HTTP error raised by the image API with a preserved response body."""

    def __init__(self, status_code: int, response_body: str) -> None:
        """Initializes the request error."""
        super().__init__(f"HTTP {status_code}: {response_body}")
        self.status_code = status_code
        self.response_body = response_body


@dataclass(frozen=True)
class ImageAsset:
    """Describes one image asset to generate."""

    key: str
    kind: AssetKind
    name: str
    size: str
    prompt: str
    transparent_background: bool


STYLE_PREFIX = (
    "写实青春校园电影感，中国高中真实环境，真实人物比例，克制自然的表演，"
    "温暖但不煽情，画面干净，细节可信，不要动漫风，不要夸张表情，"
    "不要水印，不要字幕，不要乱码，不要多余文字。"
)

SCENE_SUFFIX = (
    "构图为 16:9 横图，适合视觉小说背景。画面需要预留底部对话框空间，"
    "主体不要被底部 25% 区域遮挡。若要求出现中文文字，只出现指定文字。"
)

CHARACTER_SUFFIX = (
    "生成单人或指定人物立绘，3:4 竖图，人物完整清晰，适合视觉小说使用。"
    "透明背景 PNG，若透明背景不可用则使用纯色亮绿色背景 #00FF00，"
    "人物边缘清晰，方便后期抠图。不要额外文字。"
)


ASSETS: list[ImageAsset] = [
    ImageAsset(
        key="scene_oath_playground",
        kind="scene",
        name="百日誓师操场",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 清晨中国高中操场，温暖阳光，许多中国高中生穿蓝白运动校服整齐站队宣誓。"
            "操场前方有红色横幅，横幅清楚写“百日誓师大会”；操场边有倒计时牌，清楚写“距离高考还有100天”。"
            "画面中心偏前预留主角站位，氛围热血但带一点紧张。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_mock_score_classroom",
        kind="scene",
        name="一模成绩公布教室",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 高三教室，黑板角落清楚写“一模成绩”。老师正在发成绩单，"
            "学生有人低头沉默，有人小声讨论，有人露出一点开心。光线略冷，桌面有试卷、笔袋、课本，"
            "突出成绩单带来的沉默压力，压抑但不绝望。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_review_classroom",
        kind="scene",
        name="课后错题复盘教室",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 暖色教室灯光，讲台上留着刚讲完的试卷。课桌上摊开一模试卷、错题本和彩色笔。"
            "错题本页面清楚写“审题错误”“基础漏洞”“时间不够”“计算失误”。旁边有一张计划表，"
            "标题清楚写“最后一百天复习计划”。氛围安静、认真、重新开始。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_after_evening_school",
        kind="scene",
        name="晚自习结束后的校园",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 晚自习结束后的中国高中校园，夜晚教学楼灯光还亮着，"
            "教室黑板角落或教学楼门口清楚出现“晚自习结束”。几个学生背着书包走出教室或教学楼，"
            "树叶被夜风吹动，路灯温暖，整体有放松和选择压力并存的感觉。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_family_table",
        kind="scene",
        name="夜晚家庭餐桌",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 温暖真实的中国家庭餐厅，夜晚餐桌上有晚饭，旁边椅子放着黑色双肩包。"
            "桌上摊开计划表，纸上清楚写“本周复习计划”“错题分类”“睡眠时间”。"
            "父母坐在桌边，氛围克制温暖，不煽情，像一次终于愿意认真听对方说话的家庭沟通。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_second_mock_classroom",
        kind="scene",
        name="二模成绩公布教室",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 阳光从窗户照进高三教室，黑板上清楚写“二模成绩”。"
            "学生们看成绩，有轻微惊喜和松一口气的氛围。主角桌上放着错题本，封面清楚写“错题复盘”。"
            "画面温暖、克制励志，强调“方法开始起作用”。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_rainy_low_classroom",
        kind="scene",
        name="雨天考前低谷教室",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 阴雨天的高三教室，冷色灯光，窗外雨水滑落。"
            "墙上倒计时牌清楚写“距离高考还有20天”。桌面有一张写着“模拟测试”的试卷，试卷上有红叉。"
            "整体压抑、疲惫，但不要绝望，像低谷中仍然有人陪你稳住。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_exam_gate",
        kind="scene",
        name="高考考点入口",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 高考当天早晨，学校大门口，人群安静紧张，家长站在警戒线外。"
            "校门横幅清楚写“高考加油”，入口指示牌清楚写“考场入口”。"
            "画面中有学生拿透明文具袋入场，整体温暖克制，像真正高考当天的空气。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="scene_admission_summer_room",
        kind="scene",
        name="夏日房间与录取通知书",
        size="1536x1024",
        transparent_background=False,
        prompt=(
            f"{STYLE_PREFIX} 夏天午后，阳光明亮的房间，书桌上有写着“录取通知书”的通知书、错题本、"
            "计划表、透明文具袋，以及一张纸条，纸条清楚写“我想认真走完这一百天”。"
            "房间有高三结束后的安静感，不是狂喜，而是终于松一口气的成长感。"
            f"{SCENE_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_uniform_bag",
        kind="character",
        name="主角：百日誓师校服背包",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 17岁中国高三男生，黑色短发，身形偏瘦。穿蓝白色高中运动校服外套，"
            "白色T恤内搭，深蓝色校服长裤，白色运动鞋，背黑色双肩包。"
            "表情迷茫、紧张，像百日誓师时还不知道目标是什么。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_tired_uniform",
        kind="character",
        name="主角：一模失利疲惫状态",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，蓝白校服外套半敞，白色T恤，深蓝校服裤，"
            "白色运动鞋。头发略乱，眼神疲惫，手里可以拿成绩单。表情失落但没有崩溃。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_review_uniform",
        kind="character",
        name="主角：错题复盘状态",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，蓝白校服外套半敞，袖口微卷，白色T恤，"
            "深蓝校服裤。坐姿或半身姿态，手里拿笔，正在整理错题。眼神认真，像开始从混乱中找方向。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_bag_notebook",
        kind="character",
        name="主角：晚自习后拿错题本",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，穿蓝白校服外套，背黑色双肩包，手里拿错题本。"
            "晚自习后状态，略疲惫，表情温和犹豫，像正在朋友邀请和复习计划之间做选择。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_white_tshirt_home",
        kind="character",
        name="主角：回家白T恤",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，回家后脱下校服外套，穿白色T恤、深蓝校服裤。"
            "旁边可有书包，手里拿复习计划表。表情认真但有一点紧张，像准备向父母解释自己的安排。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_clear_uniform",
        kind="character",
        name="主角：阶段性进步清爽状态",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，蓝白校服外套，白色T恤，深蓝校服裤。"
            "状态比之前清爽，头发整齐一些，眼神有光。看到二模进步后安静微笑，不夸张庆祝。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_exhausted_uniform",
        kind="character",
        name="主角：考前低谷疲惫状态",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，蓝白校服外套略皱，白色T恤，深蓝校服裤。"
            "眼神疲惫，有轻微黑眼圈，手边有模拟测试卷。表情焦虑、低落，但仍在撑住。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_exam_uniform",
        kind="character",
        name="主角：高考入场",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国高三男生，高考当天状态，蓝白校服外套整洁，白色T恤，"
            "深蓝校服裤，白色运动鞋。手拿透明文具袋，里面有准考证、身份证、2B铅笔、橡皮、黑色签字笔。"
            "表情紧张但稳定。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="protagonist_summer_casual",
        kind="character",
        name="主角：高三结束夏日便装",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一名17岁中国男生，高三结束，不穿校服。白色T恤，浅色休闲裤，白色运动鞋。"
            "整个人更轻松，手拿或打开录取通知书，安静微笑，象征下一站开启。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="teacher_playground",
        kind="character",
        name="班主任：百日誓师操场",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 中国高中班主任，40岁左右或中青年皆可，穿朴素正式衣服。"
            "站在操场前方讲话，表情温和坚定，有老师的可靠感。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="teacher_classroom",
        kind="character",
        name="班主任：教室/办公室",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 同一位中国高中班主任，站在讲台边或学生桌旁。"
            "气质温和、克制、真实，不严厉训斥，更像在帮助学生找方向。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="deskmate_uniform",
        kind="character",
        name="同桌",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 中国高三学生，穿蓝白运动校服。表情关心但小心翼翼，"
            "像一模后轻声问主角“你还继续这么学吗？”整体不要夸张，像真实同桌。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="friend_1_uniform",
        kind="character",
        name="朋友1",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 中国高三学生，穿蓝白运动校服，性格外向温暖。"
            "晚自习后拍主角肩膀邀请放松，二模后也会替主角开心。表情自然、有少年感。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="friend_2_uniform",
        kind="character",
        name="朋友2",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 中国高三学生，穿蓝白运动校服，语气轻松。"
            "适合放在朋友1旁边，笑着说“就半小时，放松一下”。形象亲切自然。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="mother_home",
        kind="character",
        name="母亲",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 中国母亲，家庭餐桌和高考考点都可用。"
            "表情温和关切，不焦虑催促。穿日常家居服或简洁外套，整体真实生活感。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="father_home",
        kind="character",
        name="父亲",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 中国父亲，认真但不严厉。家庭餐桌上表达担心，"
            "高考当天用“考完回来吃饭”这种家常方式支持主角。表情克制温暖。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
    ImageAsset(
        key="courier_summer",
        kind="character",
        name="快递员",
        size="1024x1536",
        transparent_background=True,
        prompt=(
            f"{STYLE_PREFIX} 夏日午后送来录取通知书的快递员，穿普通快递制服或简洁工作服，"
            "手里递出信封。信封上清楚写“录取通知书”。画面生活化，不需要戏剧化。"
            f"{CHARACTER_SUFFIX}"
        ),
    ),
]


def get_api_key() -> str:
    """Returns the API key from environment variables or the script constant."""
    return os.getenv("OPENAI_API_KEY", OPENAI_API_KEY)


def get_base_url() -> str:
    """Returns the API base URL from environment variables or the script constant."""
    return os.getenv("OPENAI_BASE_URL", OPENAI_BASE_URL).rstrip("/")


def get_model_name() -> str:
    """Returns the image model name from environment variables or the script constant."""
    return os.getenv("OPENAI_IMAGE_MODEL", IMAGE_MODEL)


def get_user_agent() -> str:
    """Returns the HTTP user agent used for image API requests."""
    return os.getenv("OPENAI_HTTP_USER_AGENT", DEFAULT_USER_AGENT)


def get_optional_header_value(env_name: str, fallback_value: str) -> str | None:
    """Returns an optional header value from an env var or script constant."""
    value = os.getenv(env_name, fallback_value).strip()
    return value or None


def build_headers() -> dict[str, str]:
    """Builds HTTP headers for OpenAI-compatible image API requests."""
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": get_user_agent(),
    }
    organization = get_optional_header_value("OPENAI_ORGANIZATION", OPENAI_ORGANIZATION)
    project = get_optional_header_value("OPENAI_PROJECT", OPENAI_PROJECT)

    if organization:
        headers["OpenAI-Organization"] = organization

    if project:
        headers["OpenAI-Project"] = project

    return headers


def build_image_request(asset: ImageAsset, force_chroma_background: bool, compatibility_mode: bool) -> dict[str, object]:
    """Builds an OpenAI-compatible image generation request body."""
    prompt = asset.prompt
    request_body: dict[str, object] = {
        "model": get_model_name(),
        "prompt": prompt,
        "n": 1,
        "size": asset.size,
    }

    if not compatibility_mode:
        request_body["quality"] = "high"
        request_body["output_format"] = "png"

    if asset.transparent_background and not force_chroma_background and not compatibility_mode:
        request_body["background"] = "transparent"

    if asset.transparent_background and force_chroma_background:
        request_body["prompt"] = (
            prompt
            + " 重要：如果无法输出透明背景，请把人物放在纯色亮绿色背景 #00FF00 前，"
            "背景必须均匀、无阴影、无纹理，方便后期自动去除。"
        )

    return request_body


def request_image_once(asset: ImageAsset, force_chroma_background: bool, compatibility_mode: bool) -> bytes:
    """Requests one image and returns its PNG bytes."""
    url = f"{get_base_url()}/images/generations"
    request_body = build_image_request(asset, force_chroma_background, compatibility_mode)
    request_bytes = json.dumps(request_body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url=url,
        data=request_bytes,
        headers=build_headers(),
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            response_text = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise ImageRequestError(error.code, error_body) from error

    parsed_response = cast(ImageApiResponse, json.loads(response_text))
    first_item = parsed_response.get("data", [{}])[0]

    if "b64_json" in first_item:
        return base64.b64decode(first_item["b64_json"])

    if "url" in first_item:
        return download_image(first_item["url"])

    raise RuntimeError(f"No image data returned for {asset.key}. Response: {response_text[:500]}")


def request_image(
    asset: ImageAsset,
    force_chroma_background: bool,
    compatibility_mode: bool,
    max_retries: int,
    retry_delay_seconds: float,
) -> bytes:
    """Requests one image with retries for gateway timeouts and rate limits."""
    attempt = 0

    while True:
        try:
            return request_image_once(asset, force_chroma_background, compatibility_mode)
        except ImageRequestError as error:
            attempt += 1

            if attempt > max_retries or not is_retryable_error(error):
                raise

            delay_seconds = get_retry_delay_seconds(error.response_body, retry_delay_seconds, attempt)
            print(
                f"WARN  {asset.key} request failed with HTTP {error.status_code}; "
                f"retry {attempt}/{max_retries} after {delay_seconds:.0f}s."
            )
            time.sleep(delay_seconds)


def is_retryable_error(error: ImageRequestError) -> bool:
    """Returns True when an image request error is worth retrying."""
    if error.status_code in {408, 409, 425, 429, 500, 502, 503, 504, 520, 522, 523, 524}:
        return True

    return '"retryable":true' in error.response_body or '"retryable": true' in error.response_body


def get_retry_delay_seconds(response_body: str, fallback_delay: float, attempt: int) -> float:
    """Extracts retry_after from an error body, falling back to exponential delay."""
    try:
        parsed_body = json.loads(response_body)
    except json.JSONDecodeError:
        return fallback_delay * attempt

    retry_after = parsed_body.get("retry_after")

    if isinstance(retry_after, (int, float)):
        return float(retry_after)

    return fallback_delay * attempt


def download_image(url: str) -> bytes:
    """Downloads image bytes from a URL returned by the image API."""
    with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return response.read()


def output_path_for(asset: ImageAsset) -> Path:
    """Returns the output path for an asset."""
    folder_name = "scenes" if asset.kind == "scene" else "characters"
    return OUTPUT_ROOT / folder_name / f"{asset.key}.png"


def save_bytes(path: Path, image_bytes: bytes) -> None:
    """Writes image bytes to disk."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(image_bytes)


def remove_chroma_background_if_possible(path: Path) -> bool:
    """Attempts to remove a pure green background with Pillow.

    Returns True when cleanup was performed. This is intentionally optional so
    the script still works without extra Python packages.
    """
    try:
        from PIL import Image
    except ImportError:
        return False

    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            is_chroma_green = green > 180 and red < 90 and blue < 120 and alpha > 0
            if is_chroma_green:
                pixels[x, y] = (red, green, blue, 0)

    image.save(path)
    return True


def should_skip(path: Path, overwrite: bool) -> bool:
    """Returns True when an existing file should not be regenerated."""
    return path.exists() and not overwrite


def generate_asset(
    asset: ImageAsset,
    overwrite: bool,
    compatibility_mode: bool,
    max_retries: int,
    retry_delay_seconds: float,
) -> None:
    """Generates one asset and writes it to disk."""
    path = output_path_for(asset)

    if should_skip(path, overwrite):
        print(f"SKIP  {asset.key} -> {path}")
        return

    print(f"START {asset.key} ({asset.name})")

    try:
        image_bytes = request_image(
            asset,
            force_chroma_background=False,
            compatibility_mode=compatibility_mode,
            max_retries=max_retries,
            retry_delay_seconds=retry_delay_seconds,
        )
        save_bytes(path, image_bytes)
    except ImageRequestError as error:
        error_body = error.response_body
        if asset.transparent_background:
            print(f"WARN  transparent request failed for {asset.key}; retrying with chroma background.")
            print(f"WARN  original error: {error.status_code} {error_body[:240]}")
            image_bytes = request_image(
                asset,
                force_chroma_background=True,
                compatibility_mode=compatibility_mode,
                max_retries=max_retries,
                retry_delay_seconds=retry_delay_seconds,
            )
            save_bytes(path, image_bytes)
            cleaned = remove_chroma_background_if_possible(path)
            print(f"INFO  chroma cleanup {'done' if cleaned else 'skipped; install pillow for local cleanup'}")
        elif error.status_code == 403 and "1010" in error_body:
            raise RuntimeError(
                "Image generation was blocked with HTTP 403 / code 1010. "
                "This usually means the API gateway/CDN rejected the request client. "
                "The script now sends a browser-like User-Agent; if this still happens, "
                "set OPENAI_HTTP_USER_AGENT to a browser UA string, confirm the API key is valid for image generation, "
                "or ask the provider to allow server-side API calls to /v1/images/generations. "
                f"Original response: {error_body}"
            ) from error
        else:
            raise RuntimeError(f"Image generation failed for {asset.key}: {error.status_code} {error_body}") from error

    print(f"DONE  {asset.key} -> {path}")


def parse_args() -> argparse.Namespace:
    """Parses command line arguments."""
    parser = argparse.ArgumentParser(description="Generate visual novel scene and character images.")
    parser.add_argument("--only", choices=["scene", "character"], help="Generate only scene images or only character images.")
    parser.add_argument("--keys", nargs="*", help="Generate only assets with these keys.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing image files.")
    parser.add_argument("--sleep", type=float, default=0.0, help="Seconds to wait before submitting each request batch item.")
    parser.add_argument("--concurrency", type=int, default=6, help="Maximum number of image requests to run concurrently.")
    parser.add_argument("--retries", type=int, default=DEFAULT_MAX_RETRIES, help="Retry count for timeout, rate-limit, and gateway errors.")
    parser.add_argument("--retry-delay", type=float, default=DEFAULT_RETRY_DELAY_SECONDS, help="Fallback seconds between retries.")
    parser.add_argument(
        "--compat",
        action="store_true",
        help="Send only model, prompt, n, and size. Use this for third-party API gateways that reject newer image parameters.",
    )
    return parser.parse_args()


def filter_assets(asset_kind: str | None, selected_keys: list[str] | None) -> list[ImageAsset]:
    """Filters assets by kind and key list."""
    selected_key_set = set(selected_keys or [])

    return [
        asset
        for asset in ASSETS
        if (asset_kind is None or asset.kind == asset_kind)
        and (not selected_key_set or asset.key in selected_key_set)
    ]


def validate_configuration() -> None:
    """Raises an error if placeholder credentials are still configured."""
    api_key = get_api_key()

    if not api_key or api_key == "REPLACE_WITH_YOUR_API_KEY":
        raise RuntimeError(
            "Set OPENAI_API_KEY in the environment or replace OPENAI_API_KEY in scripts/generate_assets.py."
        )


def generate_assets_concurrently(
    assets: list[ImageAsset],
    overwrite: bool,
    compatibility_mode: bool,
    concurrency: int,
    sleep_seconds: float,
    max_retries: int,
    retry_delay_seconds: float,
) -> None:
    """Generates assets with a bounded thread pool and reports all failures."""
    max_workers = max(1, concurrency)
    failures: list[tuple[str, str]] = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_asset: dict[object, ImageAsset] = {}

        for asset in assets:
            if sleep_seconds > 0:
                time.sleep(sleep_seconds)

            future = executor.submit(
                generate_asset,
                asset,
                overwrite,
                compatibility_mode,
                max_retries,
                retry_delay_seconds,
            )
            future_to_asset[future] = asset

        for future in as_completed(future_to_asset):
            asset = future_to_asset[future]
            try:
                future.result()
            except Exception as error:
                failures.append((asset.key, str(error)))

    if failures:
        print("\nFAILED ASSETS")
        for asset_key, message in failures:
            print(f"- {asset_key}: {message}")
        raise RuntimeError(f"{len(failures)} asset generation task(s) failed.")


def main() -> None:
    """Runs the batch image generation workflow."""
    args = parse_args()
    validate_configuration()
    assets_to_generate = filter_assets(args.only, args.keys)

    if not assets_to_generate:
        raise RuntimeError("No assets matched the provided filters.")

    print(f"Base URL: {get_base_url()}")
    print(f"Model: {get_model_name()}")
    print(f"Output: {OUTPUT_ROOT}")
    print(f"Count: {len(assets_to_generate)}")
    print(f"Compatibility mode: {'on' if args.compat else 'off'}")
    print(f"Concurrency: {max(1, args.concurrency)}")
    print(f"Retries: {max(0, args.retries)}")

    generate_assets_concurrently(
        assets=assets_to_generate,
        overwrite=args.overwrite,
        compatibility_mode=args.compat,
        concurrency=args.concurrency,
        sleep_seconds=args.sleep,
        max_retries=max(0, args.retries),
        retry_delay_seconds=args.retry_delay,
    )


if __name__ == "__main__":
    main()
