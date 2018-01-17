#### 一个基于 node 开发调试，maven打包，tomcat发布的web框架

#### 前端web主要目录：`web/src/main/webapp/`
 ++ build      ---- 脚手架生成的node服务 <br/>
 ++ build.cas  ---- 启用cas单点登录的node服务 <br/>
 ++ config     ---- 脚手架生成的config目录 <br/>
 ++ config.app ---- tomcat发布时的配置，例如：应用名 <br/>
 ++ src        ---- 前端代码

##### 开发调试阶段
1. 在`web/src/main/webapp`目录下 <br/>
2. 使用 `npm run dev` 启用 node http 服务进行开发调试 <br/>
3. 若要启用cas单点登录，则使用 `node build.cas/dev-server`，或者修改 `web/src/main/webapp`目录下的package.json 文件，再执行 `npm run dev`
	````json
	{
		"scripts": {
			"dev": "node build.cas/dev-server.js",
			"start": "npm run dev",
			"unit": "jest test/unit/specs --coverage",
			"e2e": "node test/e2e/runner.js",
			"test": "npm run unit && npm run e2e",
			"lint": "eslint --ext .js,.vue src test/unit/specs test/e2e/specs",
			"build": "node build/build.js"
    	}
    }
    ````
* node环境开发调试阶段用到cas单点登录的意义在于：
在不启动tomcat项目的情况下获取tomcat（或其他）环境下的用户信息，这在多人协作的大型项目下非常实用。<br/>
通常，开发前端静态页面时用npm run dev 可满足；与后台开发人员联调阶段可用单点登录 npm run build.cas/cas-server    
	
##### 打包发布阶段
1. 执行maven的打包命令，打包过程大致为：<br/>
 * 先进入webapp目录下，执行 `npm install` 命令(因为node_modules目录不会提交到服务器) <br/>
 * 再执行 `npm run build` 命令 <br/>
 * 再把 `webapp/dist` 目录下的打包文件拷贝到 `webapp` 目录，即把打包好的前端代码放到 web 根目录 <br/>
 * 最后打 web.war 包操作 <br/>
2. maven 打包前端的代码主要在`web/src/main/webapp/pom.xml`第71行
	````xml
	<build>
		<plugins>
			<plugin>
				<groupId>org.codehaus.mojo</groupId>
				<artifactId>exec-maven-plugin</artifactId>
				<version>1.4.0</version>

				<executions>
					<execution>
						<id>exec-npm-install</id>
						<phase>prepare-package</phase>
						<goals>
							<goal>exec</goal>
						</goals>
						<configuration>
							<executable>npm</executable>
							<arguments>
								<argument>install</argument>
							</arguments>
							<workingDirectory>${basedir}/src/main/webapp</workingDirectory>
						</configuration>
					</execution>
					<execution>
						<id>exec-npm-run-build</id>
						<phase>prepare-package</phase>
						<goals>
							<goal>exec</goal>
						</goals>
						<configuration>
							<executable>npm</executable>
							<arguments>
								<argument>run</argument>
								<argument>build</argument>
							</arguments>
							<workingDirectory>${basedir}/src/main/webapp/</workingDirectory>
						</configuration>
					</execution>
				</executions>
			</plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-war-plugin</artifactId>
				<version>2.1.1</version>

				<configuration>
					<warSourceIncludes>WEB-INF/</warSourceIncludes>
					<webXml>${basedir}/src/main/webapp/WEB-INF/web.xml</webXml>
					<webResources>
						<resource>
							<directory>${basedir}/src/main/webapp/dist</directory>
							<!-- 目标路径 -->
							<targetPath>/</targetPath>
						</resource>
					</webResources>
				</configuration>

			</plugin>
		</plugins>
	</build>
	````

###### *因公司项目保密原因不能上传java代码和相关后台配置，后台路由跳转逻辑可自行实现。