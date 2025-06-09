-- MySQL dump 10.13  Distrib 8.0.26, for Win64 (x86_64)
--
-- Host: localhost    Database: furniture_store_db
-- ------------------------------------------------------
-- Server version	8.0.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `sale_price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'ספייס','מזרן ספייס 1.2/2','מזרנים',NULL,100.00,300.00,487,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-25 16:40:12','2025-05-26 14:11:07'),(2,'קווין','1.2/200','מזרנים',NULL,100.00,500.00,500,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-25 19:40:16','2025-05-26 14:12:58'),(3,'ספייס 120/200','מזרן ספייס מידה 120/200','מזרנים','Redberry',600.00,900.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:52:09','2025-05-26 14:11:07'),(4,'ספייס 80/190','מזרן ספייס מידה 80/190','מזרנים','Redberry',407.00,610.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:53:39','2025-05-26 14:11:07'),(5,'ספייס 80/200','מזרן ספייס מידה 80/200','מזרנים','Redberry',420.00,630.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:53:56','2025-05-26 14:11:07'),(6,'ספייס 90/200','מזרן ספייס מידה 90/200','מזרנים','Redberry',454.00,681.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:54:05','2025-05-26 14:11:07'),(7,'ספייס 120/190','מזרן ספייס מידה 120/190','מזרנים','Redberry',547.00,820.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:54:24','2025-05-26 14:11:07'),(8,'ספייס 140/190','מזרן ספייס מידה 140/190','מזרנים','Redberry',620.00,930.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:54:31','2025-05-26 14:11:07'),(9,'ספייס 140/200','מזרן ספייס מידה 140/200','מזרנים','Redberry',640.00,960.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:54:38','2025-05-26 14:11:07'),(10,'ספייס 160/190','מזרן ספייס מידה 160/190','מזרנים','Redberry',701.00,1051.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:54:45','2025-05-26 14:11:07'),(11,'ספייס 160/200','מזרן ספייס מידה 160/200','מזרנים','Redberry',723.00,1084.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:54:53','2025-05-26 14:11:07'),(14,'ספייס 180/200','מזרן ספייס מידה 180/200','מזרנים','Redberry',800.00,1200.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 13:55:34','2025-05-26 14:11:07'),(15,'הייבריד 80/190','מזרן הייבריד מידה 80/190','מזרנים','Redberry',477.00,715.50,0,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:55:39','2025-06-03 14:30:11'),(16,'הייבריד 80/200','מזרן הייבריד מידה 80/200','מזרנים','Redberry',493.00,739.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:55:49','2025-05-26 14:12:11'),(17,'הייבריד 90/200','מזרן הייבריד מידה 90/200','מזרנים','Redberry',537.00,805.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:55:57','2025-05-26 14:12:11'),(19,'הייבריד 120/190','מזרן הייבריד מידה 120/190','מזרנים','Redberry',649.00,973.50,25,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:56:13','2025-06-04 17:40:53'),(20,'הייבריד 140/190','מזרן הייבריד מידה 140/190','מזרנים','Redberry',734.00,1101.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:57:05','2025-05-26 14:12:11'),(21,'הייבריד 140/200','מזרן הייבריד מידה 140/200','מזרנים','Redberry',759.00,1138.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:57:12','2025-05-26 14:12:11'),(22,'הייבריד 160/190','מזרן הייבריד מידה 160/190','מזרנים','Redberry',827.00,1240.50,4,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:57:22','2025-05-28 16:59:17'),(23,'הייבריד 160/200','מזרן הייבריד מידה 160/200','מזרנים','Redberry',858.00,1287.00,4,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:57:29','2025-05-28 16:59:17'),(24,'הייבריד 180/200','מזרן הייבריד מידה 180/200','מזרנים','Redberry',948.00,1422.00,3,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9E%D7%96%D7%A8%D7%9F-%D7%93%D7%92%D7%9D-%D7%94%D7%99%D7%99%D7%91%D7%A8%D7%99%D7%93-600x450.png','2025-05-26 13:57:47','2025-06-03 15:03:58'),(25,'סופט 80/190','מזרן סופט מידה 80/190','מזרנים','Redberry',457.00,685.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:58:02','2025-05-26 14:12:42'),(26,'סופט 80/200','מזרן סופט מידה 80/200','מזרנים','Redberry',473.00,709.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:58:10','2025-05-26 14:12:42'),(27,'סופט 90/200','מזרן סופט מידה 90/200','מזרנים','Redberry',512.00,768.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:58:21','2025-05-26 14:12:42'),(28,'סופט 120/190','מזרן סופט מידה 120/190','מזרנים','Redberry',617.00,925.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:58:27','2025-05-26 14:12:42'),(29,'סופט 140/190','מזרן סופט מידה 140/190','מזרנים','Redberry',690.00,1035.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:58:39','2025-05-26 14:12:42'),(30,'סופט 140/200','מזרן סופט מידה 140/200','מזרנים','Redberry',712.00,1068.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:58:49','2025-05-26 14:12:42'),(31,'סופט 160/190','מזרן סופט מידה 160/190','מזרנים','Redberry',777.00,1165.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:59:51','2025-05-26 14:12:42'),(32,'סופט 160/200','מזרן סופט מידה 160/200','מזרנים','Redberry',805.00,1207.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 13:59:59','2025-05-26 14:12:42'),(33,'סופט 180/200','מזרן סופט מידה 180/200','מזרנים','Redberry',888.00,1332.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:42'),(34,'סופט 200/200','מזרן סופט מידה 200/200','מזרנים','Redberry',976.00,1464.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/soft-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:42'),(35,'קווין 80/190','מזרן קווין מידה 80/190','מזרנים','Redberry',514.00,771.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(36,'קווין 80/200','מזרן קווין מידה 80/200','מזרנים','Redberry',532.00,798.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(37,'קווין 90/200','מזרן קווין מידה 90/200','מזרנים','Redberry',581.00,871.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(38,'קווין 120/190','מזרן קווין מידה 120/190','מזרנים','Redberry',704.00,1056.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(39,'קווין 140/190','מזרן קווין מידה 140/190','מזרנים','Redberry',800.00,1200.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(40,'קווין 140/200','מזרן קווין מידה 140/200','מזרנים','Redberry',831.00,1246.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(41,'קווין 160/190','מזרן קווין מידה 160/190','מזרנים','Redberry',904.00,1356.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(42,'קווין 160/200','מזרן קווין מידה 160/200','מזרנים','Redberry',937.00,1405.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(43,'קווין 180/200','מזרן קווין מידה 180/200','מזרנים','Redberry',1042.00,1563.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(44,'קווין 200/200','מזרן קווין מידה 200/200','מזרנים','Redberry',1141.00,1711.50,5,'https://redbeary.co.il/wp-content/uploads/2024/08/queen-cool-gel-1.jpg','2025-05-26 14:01:29','2025-05-26 14:12:58'),(45,'כרית וויב','כרית וויב','כריות','Redberry',600.00,900.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/wave-1.jpg','2025-05-26 14:01:29','2025-05-26 14:17:20'),(46,'כרית דרים','כרית דרים','כריות','Redberry',520.00,780.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/%D7%9B%D7%A8%D7%99%D7%AA-%D7%97%D7%9C%D7%95%D7%9D-1.jpg','2025-05-26 14:01:29','2025-05-26 14:15:04'),(47,'כרית FANTASY','כרית FANTASY','כריות','Redberry',520.00,780.00,5,NULL,'2025-05-26 14:01:29','2025-05-26 14:01:29'),(48,'כרית BLACK COOL NIGHT','כרית BLACK COOL NIGHT','כריות','Redberry',850.00,1275.00,5,NULL,'2025-05-26 14:01:29','2025-05-26 14:01:29'),(49,'ספייס 120/200','מזרן ספייס מידה 120/200','מזרנים','Redberry',600.00,900.00,5,'https://redbeary.co.il/wp-content/uploads/2024/08/space-1.jpg','2025-05-26 14:01:29','2025-05-26 14:11:07');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price_per_unit` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (3,3,1,3,300.00),(4,4,1,3,300.00),(5,5,1,4,300.00),(6,6,19,1,973.50),(7,6,22,1,1240.50),(8,6,15,1,715.50),(9,6,24,1,1422.00),(10,6,23,1,1287.00),(11,7,15,4,715.50),(12,8,19,1,973.50),(13,8,24,1,1422.00);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `sale_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,1,NULL,600.00,'2025-05-21 16:42:07'),(2,1,'רהיטי מעיין',300.00,'2025-05-22 16:43:36'),(3,1,'רהיטי מעיין',900.00,'2025-05-23 16:47:32'),(4,1,'רהיטי מעיין',900.00,'2025-06-09 16:55:02'),(5,1,'רהיטי מעיין',1200.00,'2025-06-08 19:36:15'),(6,1,NULL,5638.50,'2025-06-01 16:59:17'),(7,1,NULL,2862.00,'2025-06-03 14:30:11'),(8,1,NULL,2395.50,'2025-06-03 15:03:58');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'shaiel','shay221290@gmail.com','$2a$10$wRwv5.ibIPYtabQZ/6U4UO8zzKiB.u9Ehb8D0SBhQR0755efnt3Be','admin','2025-05-25 16:33:54'),(3,'testuser_1748965328839','shay2212@gmail.com','$2a$10$0h6J4QXdgy/MV9dg/YB0BOI4Axv0uKDy/fo8Yy/At9qwdIdxNZ3fG','user','2025-06-03 15:42:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-09 11:44:07
