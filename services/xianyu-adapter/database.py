"""
数据库模块 - 使用SQLite存储数据
"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, LiteralString
from dataclasses import dataclass, asdict
import json
import sqlite3
import aiosqlite

try:
    from .config import settings
except ImportError:
    from config import settings

logger = logging.getLogger(__name__)


@dataclass
class Account:
    """账号数据"""
    account_id: str
    username: Optional[str] = None
    cookies: Optional[str] = None  # JSON字符串
    status: str = "offline"
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class ReplyRuleDB:
    """回复规则数据"""
    rule_id: str
    account_id: str
    name: str
    pattern: str
    reply_content: str
    priority: int = 0
    is_active: bool = True
    match_type: str = "exact"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class AutoShipRuleDB:
    """自动发货规则数据"""
    rule_id: str
    account_id: str
    name: str
    product_id: Optional[str] = None
    condition: str = "paid"
    action: str = "virtual_ship"
    delay_minutes: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class MessageLog:
    """消息日志"""
    message_id: str
    account_id: str
    conversation_id: str
    sender_id: str
    content: str
    is_auto_reply: bool = False
    reply_content: Optional[str] = None
    timestamp: Optional[datetime] = None


@dataclass
class OrderLog:
    """订单日志"""
    order_id: str
    account_id: str
    action: str  # created, shipped, completed, cancelled
    details: Optional[str] = None
    timestamp: Optional[datetime] = None


class Database:
    """数据库操作类"""
    
    def __init__(self, db_path: str = settings.DATABASE_URL.replace("sqlite:///", "")):
        self.db_path = db_path
        self.connection: Optional[aiosqlite.Connection] = None
    
    async def connect(self):
        """连接数据库"""
        try:
            self.connection = await aiosqlite.connect(self.db_path)
            self.connection.row_factory = aiosqlite.Row
            logger.info(f"数据库连接成功: {self.db_path}")
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            raise
    
    async def close(self):
        """关闭数据库连接"""
        if self.connection:
            await self.connection.close()
            logger.info("数据库连接已关闭")
    
    async def execute(self, query: LiteralString, params: tuple = None) -> aiosqlite.Cursor:
        """执行SQL语句"""
        if not self.connection:
            await self.connect()
        
        try:
            cursor = await self.connection.execute(query, params)
            await self.connection.commit()
            return cursor
        except Exception as e:
            logger.error(f"执行SQL失败: {e}")
            raise
    
    async def fetch_one(self, query: LiteralString, params: tuple = None) -> Optional[Dict[str, Any]]:
        """查询单条记录"""
        if not self.connection:
            await self.connect()
        
        try:
            cursor = await self.connection.execute(query, params)
            row = await cursor.fetchone()
            
            if row:
                return dict(row)
            return None
            
        except Exception as e:
            logger.error(f"查询失败: {e}")
            raise
    
    async def fetch_all(self, query: LiteralString, params: tuple = None) -> List[Dict[str, Any]]:
        """查询多条记录"""
        if not self.connection:
            await self.connect()
        
        try:
            cursor = await self.connection.execute(query, params)
            rows = await cursor.fetchall()
            
            return [dict(row) for row in rows]
            
        except Exception as e:
            logger.error(f"查询失败: {e}")
            raise


# 创建全局数据库实例
db = Database()


async def init_db():
    """初始化数据库"""
    try:
        await db.connect()
        
        # 创建账号表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                account_id TEXT PRIMARY KEY,
                username TEXT,
                cookies TEXT,
                status TEXT DEFAULT 'offline',
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建回复规则表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reply_rules (
                rule_id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                name TEXT NOT NULL,
                pattern TEXT NOT NULL,
                reply_content TEXT NOT NULL,
                priority INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                match_type TEXT DEFAULT 'exact',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts (account_id)
            )
        """)
        
        # 创建自动发货规则表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS auto_ship_rules (
                rule_id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                name TEXT NOT NULL,
                product_id TEXT,
                condition TEXT DEFAULT 'paid',
                action TEXT DEFAULT 'virtual_ship',
                delay_minutes INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts (account_id)
            )
        """)
        
        # 创建消息日志表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS message_logs (
                message_id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                conversation_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                content TEXT NOT NULL,
                is_auto_reply BOOLEAN DEFAULT 0,
                reply_content TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts (account_id)
            )
        """)
        
        # 创建订单日志表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS order_logs (
                order_id TEXT,
                account_id TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts (account_id)
            )
        """)
        
        # 创建配置表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS configs (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        logger.info("数据库初始化完成")
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise


# 数据库操作辅助函数
async def save_account(account: Account) -> bool:
    """保存账号"""
    try:
        await db.execute("""
            INSERT OR REPLACE INTO accounts 
            (account_id, username, cookies, status, last_login, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            account.account_id,
            account.username,
            account.cookies,
            account.status,
            account.last_login,
            account.created_at or datetime.now(),
            datetime.now(),
        ))
        return True
        
    except Exception as e:
        logger.error(f"保存账号失败: {e}")
        return False


async def get_account(account_id: str) -> Optional[Account]:
    """获取账号"""
    try:
        row = await db.fetch_one(
            "SELECT * FROM accounts WHERE account_id = ?",
            (account_id,)
        )
        
        if row:
            return Account(**row)
        return None
        
    except Exception as e:
        logger.error(f"获取账号失败: {e}")
        return None


async def get_all_accounts() -> List[Account]:
    """获取所有账号"""
    try:
        rows = await db.fetch_all("SELECT * FROM accounts")
        return [Account(**row) for row in rows]
        
    except Exception as e:
        logger.error(f"获取账号列表失败: {e}")
        return []


async def delete_account(account_id: str) -> bool:
    """删除账号"""
    try:
        await db.execute(
            "DELETE FROM accounts WHERE account_id = ?",
            (account_id,)
        )
        return True
        
    except Exception as e:
        logger.error(f"删除账号失败: {e}")
        return False


async def save_reply_rule(rule: ReplyRuleDB) -> bool:
    """保存回复规则"""
    try:
        await db.execute("""
            INSERT OR REPLACE INTO reply_rules 
            (rule_id, account_id, name, pattern, reply_content, priority, is_active, match_type, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rule.rule_id,
            rule.account_id,
            rule.name,
            rule.pattern,
            rule.reply_content,
            rule.priority,
            rule.is_active,
            rule.match_type,
            rule.created_at or datetime.now(),
            datetime.now(),
        ))
        return True
        
    except Exception as e:
        logger.error(f"保存回复规则失败: {e}")
        return False


async def get_reply_rules(account_id: str) -> List[ReplyRuleDB]:
    """获取回复规则"""
    try:
        rows = await db.fetch_all(
            "SELECT * FROM reply_rules WHERE account_id = ?",
            (account_id,)
        )
        return [ReplyRuleDB(**row) for row in rows]
        
    except Exception as e:
        logger.error(f"获取回复规则失败: {e}")
        return []


async def delete_reply_rule(rule_id: str) -> bool:
    """删除回复规则"""
    try:
        await db.execute(
            "DELETE FROM reply_rules WHERE rule_id = ?",
            (rule_id,)
        )
        return True
        
    except Exception as e:
        logger.error(f"删除回复规则失败: {e}")
        return False


async def log_message(message: MessageLog) -> bool:
    """记录消息日志"""
    try:
        await db.execute("""
            INSERT INTO message_logs 
            (message_id, account_id, conversation_id, sender_id, content, is_auto_reply, reply_content, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            message.message_id,
            message.account_id,
            message.conversation_id,
            message.sender_id,
            message.content,
            message.is_auto_reply,
            message.reply_content,
            message.timestamp or datetime.now(),
        ))
        return True
        
    except Exception as e:
        logger.error(f"记录消息日志失败: {e}")
        return False


async def log_order(order: OrderLog) -> bool:
    """记录订单日志"""
    try:
        await db.execute("""
            INSERT INTO order_logs 
            (order_id, account_id, action, details, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (
            order.order_id,
            order.account_id,
            order.action,
            order.details,
            order.timestamp or datetime.now(),
        ))
        return True
        
    except Exception as e:
        logger.error(f"记录订单日志失败: {e}")
        return False