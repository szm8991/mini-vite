//node服务器，处理浏览器加载各种资源的请求

//koa
const Koa = require('koa'); //创建实例
const app = new Koa();
const fs = require('fs');
const path = require('path');
//解析sfc的编译器
const complieSFC = require('@vue/compiler-sfc');
//编译模板的编译器
const complieDOM = require('@vue/compiler-dom');
//中间件配置
//处理路由
app.use(async ctx => {
  const { url, query } = ctx.request;
  //加载首页index.html
  if (url === '/') {
    ctx.type = 'text/html';
    ctx.body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8');
  } else if (url.endsWith('.js')) {
    //加载index.html中引用的main.js
    const p = path.join(__dirname, url);
    // console.log(__dirname, p);
    ctx.type = 'application/javascript';
    ctx.body = rewriteImport(fs.readFileSync(p, 'utf-8'));
  } else if (url.startsWith('/@modules/')) {
    //裸模块名称
    const moudleName = url.replace('/@modules/', '');
    //去node_modules目录下找文件
    const prefix = path.join(__dirname, '../node_modules', moudleName);
    // package.json中获取module字段
    const module = require(`${prefix}/package.json`).module;
    const filePath = path.join(prefix, module);
    ctx.type = 'application/javascript';
    ctx.body = rewriteImport(fs.readFileSync(filePath, 'utf-8'));
  } else if (url.indexOf('.vue') > -1) {
    //读取vue文件，解析为js文件
    const p = path.join(__dirname, url.split('?')[0]);
    const res = complieSFC.parse(fs.readFileSync(p, 'utf-8'));
    // console.log(res);
    if (!query.type) {
      //SFC(单文件组件)请求
      //获取脚本部分的内容
      const scriptContent = res.descriptor.script.content;
      //替换默认导出为常量，方便后续修改
      const script = scriptContent.replace('export default ', 'const __script = ');
      //获取css
      const cssContent = res.descriptor.styles[0].content;
      const css = cssContent.replace(/\s/g, '');
      // console.log(css);
      ctx.type = 'application/javascript';
      ctx.body = `
      ${rewriteImport(script)}
//添加样式
const fragment=document.createElement('style');
fragment.type = 'text/css'; 
fragment.innerHTML="${css}";
document.head.appendChild(fragment);
//解析模板
import {render as __render} from '${url}?type=template';
__script.render = __render;
export default __script;
    `;
    } else if (query.type === 'template') {
      const tpl = res.descriptor.template.content;
      //编译模板为render函数
      const render = complieDOM.compile(tpl, { mode: 'module' }).code;
      //console.log(render);
      ctx.type = 'application/javascript';
      ctx.body = rewriteImport(render);
    }
  }
});
//裸模块地址重写
function rewriteImport(content) {
  return content.replace(/ from ['"](.*)['"]/g, (s1, s2) => {
    if (s2.startsWith('/') || s2.startsWith('./') || s2.startsWith('../')) {
      return s1;
    } else {
      //这是一个裸模块需要替换
      return ` from '/@modules/${s2}'`;
    }
  });
}
app.listen(3000, () => console.log('Succsee on :http://127.0.0.1:3000'));
