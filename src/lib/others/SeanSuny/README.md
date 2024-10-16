# 用 docker 运行 sign 服务
- 克隆子模块(如果已经有则忽略)
```shell
touch .gitmodules
git submodule add https://github.com/SeanSuny/Signapi.git src/lib/others/SeanSuny/Signapi
```
- 本地生成 docker image(或者直接拉 hub 中的 image)
```shell
cd SeanSuny/Signapi
docker build -t seansuny/signapi:latest .
```
- 本地生成 docker container
```shell
docker run -dit \
--name Sign \
--hostname Sign \
--network bridge \
--restart always \
-p 17840:17840 \
-e TZ=Asia/Shanghai \
seansuny/signapi:latest
```
注: 前者 17840 是本机端口, 可以变更, 后者 17840 是 docker 服务的端口(不能更改)
- 在 .env.product.json 配置指定 sign 路径
```json
{"JD_SIGN_API":"http://ip:17840/sign"}
```


