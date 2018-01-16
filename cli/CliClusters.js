const myAWS = require('../server/misc/myAWS')
const graph = require('../server/misc/graph')
const pad = require('../server/misc/util').pad
const capitalize = require('../server/misc/util').capitalize
const download = require('../server/misc/download')

function CliClusters(region) {
  region = myAWS.checkAwsRegion(region)

  // Clear existing list of nodes and reload everything
  graph.reset();
  download.downloadInstances(err => {
    download.downloadTargetGroups(false, err => {
      download.downloadLoadBalancers(false, err => {
        download.downloadClusters(err => {
          if (err) {
            console.log('Error: ', err)
          }

          // Display cluster -> service -> task -> instance
          clusterReport();

        })
      })
    })
  })
}

function clusterReport() {

  console.log();
  console.log('ECS Clusters');
  console.log('------------');
  graph.nodesByType(graph.CLUSTER).forEach(cluster => {
    console.log();
    console.log(`Cluster ${cluster.id}:`);

    // Instances
    cluster.children.forEach(childKey => {
      if (childKey.startsWith(graph.INSTANCE)) {
        console.log(`  ${childKey}`);
      }
    });

    // Services
    cluster.children.forEach(childKey => {
      if (childKey.startsWith(graph.SERVICE)) {
        console.log(`  ${childKey}`);

        let service = graph.nodeWithKey(childKey);
        service.children.forEach(childKey => {
          if (childKey.startsWith(graph.TASK)) {
            console.log(`    ${childKey}`);
          }
        });

        // Target groups
        service.parents.forEach(key => {
          if (key.startsWith(graph.TARGETGRP)) {
            console.log(`    ${key}`);

            let tg = graph.nodeWithKey(key);
            tg.parents.forEach(key => {
              if (key.startsWith(graph.ALB)) {
                console.log(`      ${key}`);
              }
            });
          }
        });
      }
    });

    // Other
    cluster.children.forEach(childKey => {
      if ( !childKey.startsWith(graph.INSTANCE) && !childKey.startsWith(graph.SERVICE)) {
        console.log(`  ${childKey}`);
      }
    });
  });
}

module.exports = CliClusters;