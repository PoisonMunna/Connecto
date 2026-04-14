-- ============================================================
--  SOCIAL APP - Complete Database Schema + Dummy Data
--  Run this file in MySQL: source schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS social_app;
USE social_app;

-- -------------------------------------------------------
-- TABLE: users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash stored here
  bio         TEXT,
  profile_pic VARCHAR(255) DEFAULT 'default.png',
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- TABLE: posts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  content    TEXT         NOT NULL,
  image_url  VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- TABLE: likes
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  post_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, post_id),   -- one like per user per post
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE
);

-- -------------------------------------------------------
-- TABLE: comments
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  post_id    INT  NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- TABLE: followers
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS followers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,   -- the person who follows
  followed_id INT NOT NULL,   -- the person being followed
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_follow (follower_id, followed_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- TABLE: notifications
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,   -- who receives notification
  from_user  INT         NOT NULL,   -- who triggered it
  type       ENUM('like','comment','follow') NOT NULL,
  post_id    INT         DEFAULT NULL,
  is_read    TINYINT(1)  DEFAULT 0,
  created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id)   REFERENCES posts(id) ON DELETE CASCADE
);

-- ============================================================
--  DUMMY DATA
--  Passwords below are bcrypt hashes of "password123"
-- ============================================================

INSERT INTO users (username, email, password, bio, profile_pic) VALUES
('alice',   'alice@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y', 'Photography lover 📷 | Travel addict ✈️',       'default.png'),
('bob',     'bob@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y', 'Full-stack dev 💻 | Coffee first, then code ☕', 'default.png'),
('charlie', 'charlie@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y', 'Musician 🎸 | Living one chord at a time',       'default.png'),
('diana',   'diana@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y', 'Bookworm 📚 | Tea enthusiast 🍵',                'default.png'),
('ethan',   'ethan@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y', 'Fitness freak 💪 | Gym is my second home',       'default.png');

INSERT INTO posts (user_id, content) VALUES
(1, 'Just got back from Shimla — the mountains were absolutely breathtaking! 🏔️ #Travel #Mountains'),
(2, 'Finally shipped my side project after 3 months of grinding. Feels amazing! 🚀 #buildinpublic'),
(3, 'Wrote a new song today. Nothing beats the feeling of finishing a track 🎵 #Music #Indie'),
(4, 'Currently reading "Atomic Habits" — every developer should read this. 10/10 📖'),
(5, 'Morning run ✅ — 10km done before sunrise. What is your morning routine? 💪'),
(1, 'Street photography session in Old Delhi. The chaos is beautiful. 📸 #Photography'),
(2, 'Hot take: writing clean code is a form of respect for your future self. 🧹 #CodeQuality'),
(3, 'Jamming session tonight with the band. New EP dropping next month 🎶 #StayTuned'),
(4, 'Rainy day + hot chai + a good book = perfect Sunday ☕📚 #Cozy'),
(5, 'Rest day today but prepped all meals for the week. Consistency is the key! 🥗'),
(2, 'Open source contribution made today. Give back to the community! ❤️ #OpenSource'),
(1, 'Sunrise hike was worth every early alarm. Life is better outdoors 🌅');

INSERT INTO likes (user_id, post_id) VALUES
(2,1),(3,1),(4,1),(5,1),
(1,2),(3,2),(4,2),
(1,3),(2,3),(5,3),
(2,4),(3,4),(5,4),
(1,5),(2,5),(4,5),
(3,6),(4,6),(5,6),
(1,7),(4,7),(5,7),
(1,8),(2,8),(4,8),
(2,9),(3,9),(5,9),
(1,10),(3,10),(4,10),
(1,11),(3,11),(4,11),(5,11),
(2,12),(3,12),(4,12),(5,12);

INSERT INTO comments (user_id, post_id, content) VALUES
(2,  1,  'Shimla is on my bucket list! How was the weather?'),
(3,  1,  'The mountains heal everything 🏔️'),
(1,  2,  'Congrats Bob! What stack did you use?'),
(4,  2,  'Shipping is a superpower. Well done!'),
(2,  3,  'Drop the track link when it is out! 🎸'),
(1,  4,  'Atomic Habits changed my life. Great pick Diana!'),
(5,  4,  'On my reading list now, thanks!'),
(2,  5,  '10km before sunrise — you are a beast Ethan! 🔥'),
(3,  5,  'Inspired to start running again. Thanks for this!'),
(1,  7,  'Totally agree. Code is communication.'),
(5,  9,  'Cozy vibes. I love rainy Sundays too ☕'),
(4, 11,  'Open source is the backbone of modern dev. Respect!');

INSERT INTO followers (follower_id, followed_id) VALUES
(1,2),(1,3),(1,4),   -- alice follows bob, charlie, diana
(2,1),(2,3),(2,5),   -- bob follows alice, charlie, ethan
(3,1),(3,2),(3,4),   -- charlie follows alice, bob, diana
(4,1),(4,5),         -- diana follows alice, ethan
(5,2),(5,3),(5,4);   -- ethan follows bob, charlie, diana
