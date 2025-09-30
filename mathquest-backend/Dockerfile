FROM maven:3.9.11-eclipse-temurin-25 AS build
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:25_36-jre-jammy
COPY --from=build /target/*target/*.jar demo.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","demo.jar"]