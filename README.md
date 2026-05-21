# Our-Gao-Kao

《倒计时100天》是一款高三题材视觉小说网页游戏。玩家从百日誓师开始，经历一模碰壁、错题复盘、友情边界、家庭沟通、阶段性进步、考前低谷、高考入场和录取通知书。游戏重点不是“考高分爽文”，而是让玩家在选择里看见：努力、稳定、支持、勇气和成长怎样慢慢留下来。

当前版本不使用视频素材。项目先搭好视觉小说架构、剧情、选项、状态与存档逻辑，场景图片和人物图片后续由你提供，再替换现有占位画面。

## 项目定位

- 类型：高三青春成长视觉小说
- 篇幅：9 幕主线
- 平台：浏览器网页
- 技术栈：Vite + React + TypeScript
- 美术策略：先占位，后接入你提供的场景图与人物图
- 核心体验：每个选择不只是改变数值，也改变玩家最终保存下来的记忆

## 运行方式

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 当前玩法

- 第 1 幕：百日誓师，选择初始路线
- 第 2 幕：一模碰壁，选择应对失利的方式
- 第 3 幕：策略调整，解锁复盘路线
- 第 4 幕：友情与边界，处理朋友邀请
- 第 5 幕：家庭沟通，选择如何回应父母
- 第 6 幕：阶段性进步，决定下一步策略
- 第 7 幕：考前低谷，选择最后阶段节奏
- 第 8 幕：高考当天，选择入场方式
- 第 9 幕：录取通知书，依次点亮努力、勇气、成长

轻量状态包括：

- 心态
- 压力
- 策略
- 稳定
- 体力
- 支持
- 信心
- 成长

选择会改变状态，并解锁“错题复盘 Lv.1”“家庭支持”“稳定作息”“努力已保存”等装备或记忆标记。第 9 幕不是三选一，而是三个选项依次点亮，最后进入结局总结。

## 内容结构

核心剧情集中在 `src/content.ts`：

- `visual_novel_scenes`：9 幕剧情、台词、画面文字、UI 文字、选项和后果
- `asset_requirements`：后续需要提供的场景图、人物图、道具图清单
- `speaker_labels`：角色名显示
- `stat_labels`：状态名显示

核心逻辑集中在 `src/game_logic.ts`：

- `create_initial_state`：创建视觉小说初始状态
- `get_current_scene`：获取当前幕
- `choose_visual_novel_option`：处理选项、更新状态、推进剧情
- `format_effects`：格式化选项效果
- `create_ending`：生成最终总结

界面入口集中在 `src/App.tsx`，视觉小说样式集中在 `src/styles.css`。

## 存档策略

- 使用 `localStorage`
- 新存档 key：`our_gao_kao_visual_novel_save_v1`
- 状态包含 `save_version: 1`
- 旧版 30 天模拟存档不会被读取
- 如果读取到不兼容存档，会自动清理该 VN 存档 key

## 图片需求总览

图片先不要加入项目。当前版本用占位画面显示资源 key。后续建议按 16:9 横图优先提供场景图，人物可提供立绘或直接融入场景 CG。

## 批量生成图片

项目提供了一个可替换 Key 和 BaseURL 的脚本：

```bash
python scripts/generate_assets.py
```

你需要先在 `scripts/generate_assets.py` 中替换：

```python
OPENAI_BASE_URL = "https://api.openai.com/v1"
OPENAI_API_KEY = "REPLACE_WITH_YOUR_API_KEY"
IMAGE_MODEL = "gpt-image-2"
```

更推荐用环境变量覆盖，避免把 API Key 写入仓库：

```bash
OPENAI_BASE_URL="https://api.kaopuapi.xyz/v1" \
OPENAI_API_KEY="你的 API Key" \
OPENAI_IMAGE_MODEL="gpt-image-2" \
python scripts/generate_assets.py
```

常用参数：

```bash
# 只生成场景图
python scripts/generate_assets.py --only scene

# 只生成人物图
python scripts/generate_assets.py --only character

# 只生成指定图片
python scripts/generate_assets.py --keys scene_oath_playground protagonist_exam_uniform

# 覆盖已有图片
python scripts/generate_assets.py --overwrite

# 第三方代理不支持 quality/background/output_format 等参数时使用兼容模式
python scripts/generate_assets.py --compat
```

如果遇到 `HTTP Error 403` 且返回 `error code: 1010`，通常是第三方 API 网关/CDN 拒绝了默认 Python 请求客户端。脚本已经默认发送浏览器风格的 `User-Agent`。如果仍然报错，可以显式设置：

```bash
OPENAI_HTTP_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" \
OPENAI_BASE_URL="https://api.kaopuapi.xyz/v1" \
OPENAI_API_KEY="你的 API Key" \
OPENAI_IMAGE_MODEL="gpt-image-2" \
python scripts/generate_assets.py --compat
```

如果还是 403，需要确认该服务商是否允许服务端脚本访问 `/v1/images/generations`，以及你的 Key 是否开通图片生成权限。

输出目录：

- 场景图：`public/assets/generated/scenes`
- 人物图：`public/assets/generated/characters`

人物图会优先请求透明背景 PNG。如果目标模型或代理接口不支持透明背景，脚本会自动重试为纯绿色背景，并在安装 Pillow 时尝试本地去绿幕：

```bash
pip install pillow
```

### 场景图

1. `scene_oath_playground`：百日誓师操场。清晨操场、温暖阳光、蓝白校服学生宣誓；横幅写“百日誓师大会”，倒计时牌写“距离高考还有100天”。
2. `scene_mock_score_classroom`：一模成绩公布教室。黑板角落写“一模成绩”，老师发成绩单，学生有人开心有人沉默，压抑但不绝望。
3. `scene_review_classroom`：课后错题复盘教室。桌面有试卷和错题本，错题本写“审题错误”“基础漏洞”“时间不够”“计算失误”，计划表写“最后一百天复习计划”。
4. `scene_after_evening_school`：晚自习结束后的教学楼。教学楼灯还亮着，黑板或门口有“晚自习结束”，学生结伴离开。
5. `scene_family_table`：夜晚家庭餐桌。温暖家中灯光，书包在椅子旁，桌上计划表写“本周复习计划”“错题分类”“睡眠时间”。
6. `scene_second_mock_classroom`：二模成绩公布教室。阳光教室，黑板写“二模成绩”，桌上错题本封面写“错题复盘”。
7. `scene_rainy_low_classroom`：雨天考前低谷教室。窗外下雨，倒计时牌写“距离高考还有20天”，试卷写“模拟测试”并有红叉。
8. `scene_exam_gate`：高考考点入口。校门横幅写“高考加油”，指示牌写“考场入口”，家长在警戒线外。
9. `scene_admission_summer_room`：夏日房间与录取通知书。桌上有录取通知书、错题本、计划表、透明文具袋、纸条“我想认真走完这一百天”。

### 人物图

1. `protagonist_uniform_bag`：主角百日誓师状态。17 岁中国高三男生，黑色短发，偏瘦，蓝白校服外套、白 T、深蓝校服裤、白运动鞋、黑色双肩包，迷茫紧张。
2. `protagonist_tired_uniform`：主角一模失利状态。校服外套半敞，头发略乱，疲惫失落但不崩溃。
3. `protagonist_review_uniform`：主角错题复盘状态。袖口微卷，用彩色笔整理错题，神情认真。
4. `protagonist_bag_notebook`：主角晚自习后状态。背黑色双肩包，手拿错题本，疲惫但温和犹豫。
5. `protagonist_white_tshirt_home`：主角回家状态。白 T、深蓝校服裤，书包放椅子旁，拿出复习计划表。
6. `protagonist_clear_uniform`：主角阶段性进步状态。校服整洁清爽，看到进步后安静微笑。
7. `protagonist_exhausted_uniform`：主角考前低谷状态。校服略皱，有轻微黑眼圈，看着模拟测试卷。
8. `protagonist_exam_uniform`：主角高考入场状态。校服整洁，手拿透明文具袋，内有准考证、身份证、2B 铅笔、橡皮、黑色签字笔。
9. `protagonist_summer_casual`：主角高三结束状态。白 T、浅色休闲裤、白运动鞋，打开录取通知书时安静微笑。
10. `teacher_playground`：百日誓师操场班主任。温和坚定，站在操场前方讲话。
11. `teacher_classroom`：教室/办公室班主任。温和、克制、真实教师气质。
12. `deskmate_uniform`：同桌。蓝白校服，一模后关心主角。
13. `friend_1_uniform`：朋友1。蓝白校服，外向温暖，邀请主角放松，二模后替主角高兴。
14. `friend_2_uniform`：朋友2。蓝白校服，轻松附和朋友邀请。
15. `mother_home`：母亲。餐桌和高考考点使用，温和关切，不夸张煽情。
16. `father_home`：父亲。认真但不严厉，表达担心和家常支持。
17. `courier_summer`：快递员。夏日午后递来写有“录取通知书”的信封。

## 设计原则

- 不使用视频素材
- 不把选项写成标准答案
- 不把成绩作为唯一胜利条件
- 不用羞辱式文案描述失利
- 允许害怕、停顿、回避和重新开始
- 文案保持细腻、克制，贴近考生真实体验
