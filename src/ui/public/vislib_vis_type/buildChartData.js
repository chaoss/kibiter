define(function (require) {
  return function VislibVisBuildChartData(Private) {
    var aggResponse = Private(require('ui/agg_response/index'));
    var Table = Private(require('ui/agg_response/tabify/_table'));

    return function (esResponse) {
      var vis = this.vis;

      if (esResponse.aggregations) {
        var aggs = esResponse.aggregations[_.keys(esResponse.aggregations)[0]];
        if (aggs.sum_other_doc_count) {
          if (aggs.buckets[0][1]) {
            // Unique count
            aggs.buckets.push({
              '1': {"value": aggs.sum_other_doc_count},
              'key':'Others',
              'doc_count': aggs.sum_other_doc_count
            });
          }
          else {
            // Add another bucket with sum_other_doc_count
            aggs.buckets.push({
              'key':'Others',
              'doc_count': aggs.sum_other_doc_count
            });
          }
        }
      }

      if (vis.isHierarchical()) {
        // the hierarchical converter is very self-contained (woot!)
        return aggResponse.hierarchical(vis, esResponse);
      }

      var tableGroup = aggResponse.tabify(vis, esResponse, {
        canSplit: true,
        asAggConfigResults: true
      });

      var converted = convertTableGroup(vis, tableGroup);
      if (!converted) {
        // mimic a row of tables that doesn't have any tables
        // https://github.com/elastic/kibana/blob/7bfb68cd24ed42b1b257682f93c50cd8d73e2520/src/kibana/components/vislib/components/zero_injection/inject_zeros.js#L32
        converted = { rows: [] };
      }

      converted.hits = esResponse.hits.total;

      return converted;
    };

    function convertTableGroup(vis, tableGroup) {
      var tables = tableGroup.tables;
      var firstChild = tables[0];
      if (firstChild instanceof Table) {

        var chart = convertTable(vis, firstChild);
        // if chart is within a split, assign group title to its label
        if (tableGroup.$parent) {
          chart.label = tableGroup.title;
        }
        return chart;
      }

      if (!tables.length) return;
      var out = {};
      var outList;

      tables.forEach(function (table) {
        if (!outList) {
          var aggConfig = table.aggConfig;
          var direction = aggConfig.params.row ? 'rows' : 'columns';
          outList = out[direction] = [];
        }

        var output;
        if (output = convertTableGroup(vis, table)) {
          outList.push(output);
        }
      });

      return out;
    }

    function convertTable(vis, table) {
      return vis.type.responseConverter(vis, table);
    }
  };
});
