(function(){
  UI.registerHelper('iter', UI.Component.extend({
    __helperHost : true,
    kind : 'IterationComponent',
    init : function(){
      var root = this.get('root');
      if(!root){
        throw new Meteor.Error(10000, '缺失必要参数', '必须含有root参数');
      }
      this.helpers({
        children : function(){
          return [root];
        }
      });
    },
    render : function(){
      var content = this.__content;
      var childrenPropertyName = this.get('childrenPropertyName') || 'children';
      // 迭代器，如果第一个参数是true，表示不是第一次加载
      function iterate(){
        var iteration = this;
        // 获取根模板
        var rootContent = content.render()[1];
        // 判断是否为第一次加载
        var first = arguments[0] === true ? false : true;
        // 重新填充根模板，以节点模板填充
        rootContent.children = [UI.Each(function(){
          // 如果是第一次获取对象，是直接获取，非“this.”的操作
          return first ? Spacebars.call(iteration.lookup(childrenPropertyName)) : Spacebars.dataMustache(Spacebars.dot(iteration.lookup('.'),childrenPropertyName));
        }, UI.block(function(){
          var block = this;
          // 循环块中获取节点模板
          var nodeContent = content.render.call(block)[1].children[1];
          // 将迭代部分加入到节点模板的末尾
          nodeContent.children.push(iterate.call(block, true));
          return nodeContent;
        }))];
        return rootContent;
      };
      return iterate.call(this);
    }
  }));
})();
