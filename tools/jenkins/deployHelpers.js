def performUIDeploy(String hostRoute, String stageEnv, String projectEnv, String repoName, String appName, String jobName, String tag, String sourceEnv, String targetEnvironment, String appDomain, String frontendDCRaw, String backendDCRaw, String minReplicasFE, String maxReplicasFE, String minCPUFE, String maxCPUFE, String minMemFE, String maxMemFE, String minReplicasBE, String maxReplicasBE, String minCPUBE, String maxCPUBE, String minMemBE, String maxMemBE, String targetEnv, String NAMESPACE, String commonNamespace, String penNamespace){

  script {
    openshift.withCluster() {
      openshift.withProject(projectEnv) {
        echo "Tagging Image ${repoName}-backend:${jobName} with version ${tag}"
        openshift.tag("${sourceEnv}/${repoName}-backend:${tag}", "${repoName}-backend:${tag}")

        echo "Tagging Image ${repoName}-frontend-static:${jobName} with version ${tag}"
        openshift.tag("${sourceEnv}/${repoName}-frontend-static:${tag}", "${repoName}-frontend-static:${tag}")

        echo "Processing DeploymentConfig ${appName}-backend..."
        def dcBackendTemplate = openshift.process('-f',
          "${backendDCRaw}",
          "REPO_NAME=${repoName}",
          "JOB_NAME=${jobName}",
          "NAMESPACE=${projectEnv}",
          "APP_NAME=${appName}",
          "HOST_ROUTE=${hostRoute}",
          "TAG=${tag}",
          "MIN_REPLICAS=${minReplicasBE}",
          "MAX_REPLICAS=${maxReplicasBE}",
          "MIN_CPU=${minCPUBE}",
          "MAX_CPU=${maxCPUBE}",
          "MIN_MEM=${minMemBE}",
          "MAX_MEM=${maxMemBE}"
        )

        def dcBackend = openshift.apply(dcBackendTemplate).narrow('dc')

        echo "Processing DeploymentConfig ${appName}-frontend-static..."
        def dcFrontendStaticTemplate = openshift.process('-f',
          "${frontendDCRaw}",
          "REPO_NAME=${repoName}",
          "JOB_NAME=${jobName}",
          "NAMESPACE=${projectEnv}",
          "APP_NAME=${appName}",
          "HOST_ROUTE=${hostRoute}",
          "TAG=${tag}",
          "MIN_REPLICAS=${minReplicasFE}",
          "MAX_REPLICAS=${maxReplicasFE}",
          "MIN_CPU=${minCPUFE}",
          "MAX_CPU=${maxCPUFE}",
          "MIN_MEM=${minMemFE}",
          "MAX_MEM=${maxMemFE}"
        )

        echo "Applying Deployment ${appName}-frontend-static..."
        def dcFrontendStatic = openshift.apply(dcFrontendStaticTemplate).narrow('dc')
      }
    }

  }
  script{
    dir('tools/jenkins'){
      if(tag == "latest") {
        sh "curl -s https://raw.githubusercontent.com/bcgov/${repoName}/main/tools/jenkins/update-configmap.sh | bash /dev/stdin \"${targetEnv}\" \"${appName}\" \"${commonNamespace}\" \"${penNamespace}\""
      } else {
        sh "curl -s https://raw.githubusercontent.com/bcgov/${repoName}/${tag}/tools/jenkins/update-configmap.sh | bash /dev/stdin \"${targetEnv}\" \"${appName}\" \"${commonNamespace}\" \"${penNamespace}\""
      }
    }
  }
  script{
    openshift.withCluster() {
      openshift.withProject("${projectEnv}") {
        def dcAppBE = openshift.selector('dc', "${appName}-backend-${jobName}")
        dcAppBE.rollout().cancel()
        timeout(10) {
          try{
            dcAppBE.rollout().status('--watch=true')
          }catch(Exception e){
            //Do nothing
          }
        }
        dcAppBE.rollout().latest()

        def dcAppFE = openshift.selector('dc', "${appName}-frontend-${jobName}")
        dcAppFE.rollout().cancel()
        timeout(10) {
          try{
            dcAppFE.rollout().status('--watch=true')
          }catch(Exception e){
            //Do nothing
          }
        }
        dcAppFE.rollout().latest()
      }
    }
  }
}
return this;
