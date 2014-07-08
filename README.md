使用说明
==========

##  目的

Meteor中对于线性数集，可以通过each方法进行遍历。但如果数据集是非线性的，那么就没办法展示在视图中。特此制作`iter`全局helper来辅助前端开发。

##  使用方法

首先我们要构建一颗树对象：

```javascript
var root = {name : 'root', children : [
  {name : 'node1'},
  {name : 'node2', children : [
    {name : 'node2-1'},
    {name : 'node2-2'}
  ]},
  {name : 'node3', children : [
    {name : 'node3-1', children : [
      {name : 'node3-1-1', children : [
        {name : 'node3-1-1-1'},
        {name : 'node3-1-1-2'},
        {name : 'node3-1-1-3'},
        {name : 'node3-1-1-4'},
      ]},
      {name : 'node3-1-2'}
    ]}
  ]}
]};
```

然后我们就可以按照如下方式进行渲染：

```html
{{#iter root=root}}
  <ol class="someclass">
    <li name="{{name}}">
      {{name}}
      <a href="#">链接</a>
    </li>
  </ol>
{{/iter}}
```

## 特性

### 自动拆解

树形结构其实是有两套模板，一套是根模板，一套是叶模板。为了方便开发，我们可以只提供一套模板方案，而拆解的过程将是自动的。

但格式必须是严格的：iter内部默认获取最顶级的第一个标签为根模板；然后获取根模板下最顶级的第一个标签为叶模板。也就是说，根模板是无法动态扩充的，这在实际需求中是比较吻合的；而叶模板的属性可以动态扩充，内容可以扩充。也就是说，本利的`ol`如果配置有动态属性——helper，则无法被加载的。但真实情况是他被加载的动态属性为父级属性。

