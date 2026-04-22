FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw clean package -DskipTests -B

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 --gid 1001 app
COPY --from=build /workspace/target/*.jar app.jar
RUN chown app:app app.jar
USER app

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
