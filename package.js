Package.describe({
  summary:'iterate-global-helper 拓展全局Helper，提供迭代功能'
});

Package.on_use(function(api){
  // api.use('underscore','client');
  // api.use('templating');
  api.use('ui','client');
  api.add_files('iterate.js','client');
});