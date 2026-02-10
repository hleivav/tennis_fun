# Use Maven with OpenJDK 17 for build
FROM maven:3.9-eclipse-temurin-17 AS build

# Set working directory
WORKDIR /app

# Copy BE folder contents
COPY BE/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY BE/src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use lightweight JRE for runtime
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-8080}

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
