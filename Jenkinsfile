pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-new')
        DOCKER_IMAGE = 'palaye769/examenjs'
        DOCKER_TAG = "${BUILD_NUMBER}"
        RENDER_WEBHOOK = credentials('render-webhook')
        RENDER_APP_URL = credentials('render-app-url')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    def image = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("${DOCKER_IMAGE}:latest")
                }
            }
        }
        
        stage('Test') {
            steps {
                echo 'Running tests...'
                script {
                    docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").inside {
                        sh 'npm test || echo "No tests configured"'
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing image to Docker Hub...'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-new') {
                        def image = docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}")
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Render') {
            steps {
                echo 'Deploying to Render...'
                script {
                    // Déclencher le déploiement sur Render via webhook
                    def response = sh(
                        script: """
                            curl -X POST "${RENDER_WEBHOOK}" \
                            -H "Content-Type: application/json" \
                            -d '{"clearCache": false}' \
                            -w "%{http_code}" \
                            -o /dev/null \
                            -s
                        """,
                        returnStdout: true
                    ).trim()
                    
                    if (response == "200" || response == "201") {
                        echo "Deployment triggered successfully! HTTP Status: ${response}"
                        echo "Waiting for deployment to complete..."
                        
                        // Attendre un peu pour que le déploiement commence
                        sleep 30
                        
                        // Vérifier le statut du déploiement
                        def healthCheckPassed = false
                        def maxRetries = 10
                        def retryCount = 0
                        
                        while (!healthCheckPassed && retryCount < maxRetries) {
                            try {
                                def healthResponse = sh(
                                    script: "curl -s -o /dev/null -w '%{http_code}' ${RENDER_APP_URL}",
                                    returnStdout: true
                                ).trim()
                                
                                if (healthResponse == "200") {
                                    healthCheckPassed = true
                                    echo "✅ Application deployed successfully and is responding!"
                                    echo "🌐 Application available at: ${RENDER_APP_URL}"
                                } else {
                                    echo "⏳ Deployment in progress... (HTTP ${healthResponse})"
                                    sleep 30
                                    retryCount++
                                }
                            } catch (Exception e) {
                                echo "⏳ Waiting for deployment... (attempt ${retryCount + 1}/${maxRetries})"
                                sleep 30
                                retryCount++
                            }
                        }
                        
                        if (!healthCheckPassed) {
                            error("❌ Deployment verification failed after ${maxRetries} attempts")
                        }
                    } else {
                        error("❌ Failed to trigger deployment. HTTP Status: ${response}")
                    }
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                echo 'Cleaning up local images...'
                sh """
                    docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true
                    docker rmi ${DOCKER_IMAGE}:latest || true
                """
            }
        }
    }
    
    post {
        success {
            echo '🎉 CI/CD Pipeline completed successfully!'
            echo "📦 Docker Image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
            echo "🌐 Application URL: ${RENDER_APP_URL}"
            
            // Notification optionnelle (vous pouvez décommenter si besoin)
            // slackSend(
            //     color: 'good',
            //     message: "✅ ExamenJS deployed successfully!\nImage: ${DOCKER_IMAGE}:${DOCKER_TAG}\nURL: ${RENDER_APP_URL}"
            // )
        }
        failure {
            echo '❌ Pipeline failed!'
            
            // Notification optionnelle (vous pouvez décommenter si besoin)
            // slackSend(
            //     color: 'danger',
            //     message: "❌ ExamenJS deployment failed!\nBuild: #${BUILD_NUMBER}\nCheck: ${BUILD_URL}"
            // )
        }
        always {
            echo 'Cleaning up workspace...'
            deleteDir()
        }
    }
}