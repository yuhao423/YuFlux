

### 1. 基本工程化
1. eslint   √
2. typescript   √
3. 打包配置   rollup    ×
4. prettier  代码格式化，与eslint有冲突，需要额外依赖  √
5. commit,husky 规范    ×
6. mit开源管理  ×
7. npm源管理    √


##### simple-git-hooks
本人`git`垃圾，决定采用`simple-git-hooks`来规范 git ，轻量，简洁，快速上手，感觉比`cz`好用。
用法：@see  https://gitcode.com/toplenboren/simple-git-hooks/overview?utm_source=artical_gitcode&isLogin=1
1. 安装开发依赖；`simple-git-hooks`,`lint-staged`;
2. package.json 中加入`simple-git-hooks`和`lint-staged`
3. 设置钩子，`pre-commit`,`pre-push`,`commit-msg`
```json
"simple-git-hooks": {
    "pre-commit": "pnpm lint-staged && node scripts/commitVerify.js",
    "pre-push": "pnpm format",
    "commit-msg": "node scripts/commitVerify.js",
    "preserveUnused": true
  },
```


