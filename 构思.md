iterate构想
==========

在发布正式的结果之前，我希望大家能帮我测试使用一下，看看效果怎么样。

##  前言

因为Meteor中没有迭代和递归的模板，而项目中这样的需求是存在的，例如迭代一颗树。之前采用硬编码的方法成功的迭代出一颗树，但方法笨拙。于是有了将这个helper抽离出来的想法。

```javascript
//测试数据
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

##  实现思路一

最基本的方法就是不关注多样式，而简单的将数据递归出来。

```javascript
UI.registerHelper('iterate', function(){
  var root = this.root;
  var childrenPropertyName = this.childrenPropertyName || 'children';
  /* 以下两个注释值得注意，今后如果想改变渲染方式，可以通过外部配置修改 */
  // var rootTag = 'ul';
  // var nodeTag = 'li';
  return UI.Component.extend({
    __helperHost : true,
    children : [root],
    render : function(){
      var iteration = this;
      var content = iteration.__content;
      function it(){
        var iteration = this;
        // 迭代关键地方，第一次进来的时候，上下文环境是组件，而非迭代对象
        var first = arguments[0] === true ? false : true;
        return HTML.OL(UI.Each(function(){
           return first ? Spacebars.call(iteration.lookup('children')) : Spacebars.dataMustache(Spacebars.dot(iteration.lookup('.'),'children'));
        },UI.block(function(){
          var block = this;
          block.__content = content;
          return HTML.LI([iteration.__content, it.call(block, true)])
        })));
      };
      return it.call(iteration);
    }
  });
});
```

使用方法：

```html
{{#iterator root=root childrenPropertyName="children" rootTag="ol" nodeTag="li"}}
  {{name}}
{{/iterator}}
```

0.  优点：简洁明了！
0.  缺点：对标签样式的扩展性不高，虽然具备基本可扩展性，但并非动态扩展的。

## 实现思路二

然后我想到了，定义两套模板，一套`root模板`和一套`node模板`，先渲染两个模板，再根据两个模板加载树。

```javascript
UI.registerHelper('iterate', function(){
  var root = this.root;
  var childrenPropertyName = this.childrenPropertyName || 'children';
  var It = UI.Component.extend({
    __helperHost : true,
    init : function(){
      var __contentTemplate = this;
      __contentTemplate.root = UI.Component.extend({
        init : function(){
          __contentTemplate.rootContent = this.__content;
          delete __contentTemplate.root;
        }
      });
      __contentTemplate.node = UI.Component.extend({
        init : function(){
          __contentTemplate.nodeContent = this.__content;
          delete __contentTemplate.node;
        }
      });
    },
    render : function(){
      var __contentTemplate = this;
      // 模板的加载不是并行的，而是顺序进行，因此可以利用这一点，在内容加载过程中处理模板但不返回，利用后面的组件得到处理过的模板再加载数据
      return [this.__content,UI.Component.extend({
        __helperHost : true,
        children : [root],
        render : function(){
          var iteration = this;
          var rootContent = __contentTemplate.rootContent.render()[1];
          function it(){
            var iteration = this;
            var first = arguments[0] === true ? false : true;
            return (rootContent.children = [UI.Each(function(){
               return first ? Spacebars.call(iteration.lookup(childrenPropertyName)) : Spacebars.dataMustache(Spacebars.dot(iteration.lookup('.'),childrenPropertyName));
            },UI.block(function(){
              var block = this;
              return [__contentTemplate.nodeContent, it.call(block, true)];
            }))], rootContent);
          };
          return it.call(iteration);
        }
      })];
    }
  });
  return It;
});
```

使用方法：

```html
{{#iterate root=root}}
  {{#root}}
    <ol class=""></ol>
  {{/root}}
  {{#node}}
    <li name="{{name}}">{{name}}</li>
  {{/node}}
{{/iterate}}
```

0.  优点：分离后扩展性变强，尤其在动态扩展性上。
0.  缺点：明显代码量上增加了，可读性略微有点下降。

##  实现思路三

后来，我希望写一个模板，然后自动分离成两套。于是有了下面的代码：

```javascript
UI.registerHelper('iterate', function(){
  var root = this.root;
  var childrenPropertyName = this.childrenPropertyName || 'children';
  var It = UI.Component.extend({
    __helperHost : true,
    children : [root],
    render : function(){
      var content = this.__content;
      var rootContent = content.render()[1];
      function it(){
        var iteration = this;
        var first = arguments[0] === true ? false : true;
        return (rootContent.children = [UI.Each(function(){
          return first ? Spacebars.call(iteration.lookup(childrenPropertyName)) : Spacebars.dataMustache(Spacebars.dot(iteration.lookup('.'),childrenPropertyName));
        },UI.block(function(){
          var block = this;
          // 最消耗性能的地方，每次都要重新render一下，而且必须重新指定调用对象
          var nodeContent = content.render.call(block)[1].children[1];
          return [nodeContent, it.call(block, true)];
        }))], rootContent);
      };
      return it.call(this);
    }
  });
  return It;
});
```

使用方法：

```html
{{#iterate root=root}}
  <ol class="{{name}}">
    <li name="{{name}}">{{name}}</li>
  </ol>
{{/iterate}}
```

0.  优点：写法简单明了。
0.  缺点：一方面消耗性能不说，另一方面格式比较局限（root层只能有一个标签，node层也只能有一个标签，node层内部可以拓展）。


## 问题

基于我所了解的需求，第二、三种实现写法是没什么问题了，尤其是第二种，感觉没啥问题，但是需要大家看看还有什么问题。

至于怎么用？你就把以上的js代码拷贝一份到你的项目中去，也就是`UI.registerHelper`。（这个API以前是Handlebars.registerHelper，后来改成了Spacebars.registerHelper）

> 注意：以上代码我暂均没做数据处理，也没做额外的逻辑判断，先完成的基本逻辑。

> 如果看不懂以上代码， [参照这里](https://github.com/a272121742/DE-Grid/blob/master/%E6%A8%A1%E6%9D%BFvsJS.md)
