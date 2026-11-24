# 潮汐回声 · Echoes of the Tide

一部十二关的本地双人 3D 合作冒险。两位玩家可以共用键盘或连接手柄，在同一块屏幕上分屏游玩，也可以在关卡右上角点击「双窗口」，将玩家二的视角移到另一块显示器。

[开始游戏](https://hustwyk.github.io/echoes-of-the-tide/) · [故事与关卡设计](https://hustwyk.github.io/echoes-of-the-tide/story.html)

## 本地运行

在项目根目录启动静态服务器，然后用桌面浏览器打开 `http://localhost:8000/`。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

## 更新 GitHub Pages

游戏源码和可直接发布的网页都在 `dist/`。提交更改后，在项目根目录执行以下命令。GitHub Pages 从 `gh-pages` 分支根目录发布。

```sh
git push origin main
git subtree push --prefix=dist origin gh-pages
```
