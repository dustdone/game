const os = require('os');

// 网络配置
const networkConfig = {
    // 服务器监听配置
    server: {
        host: process.env.HOST || '0.0.0.0', // 监听所有网络接口
        port: process.env.PORT || 5555,
        cors: {
            origin: process.env.CORS_ORIGIN || '*', // 允许所有来源访问
            credentials: true
        }
    },
    
    // 防火墙和安全配置
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 100 // 每个IP 15分钟内最多100个请求
        },
        allowedIPs: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [],
        blockPrivateIPs: process.env.BLOCK_PRIVATE_IPS === 'true' || false
    },
    
    // 网络接口配置
    interfaces: {
        // 获取所有网络接口
        getAll: () => {
            const interfaces = os.networkInterfaces();
            const result = [];
            
            for (const name of Object.keys(interfaces)) {
                for (const interface of interfaces[name]) {
                    if (interface.family === 'IPv4') {
                        result.push({
                            name: name,
                            address: interface.address,
                            netmask: interface.netmask,
                            internal: interface.internal,
                            family: interface.family
                        });
                    }
                }
            }
            
            return result;
        },
        
        // 获取局域网IP
        getLocalIP: () => {
            const interfaces = networkConfig.interfaces.getAll();
            const localInterface = interfaces.find(iface => !iface.internal);
            return localInterface ? localInterface.address : '127.0.0.1';
        },
        
        // 获取公网IP
        getPublicIP: async () => {
            try {
                const https = require('https');
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve('获取超时');
                    }, 5000);
                    
                    https.get('https://api.ipify.org?format=json', (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => {
                            clearTimeout(timeout);
                            try {
                                const result = JSON.parse(data);
                                resolve(result.ip);
                            } catch (e) {
                                resolve('无法解析公网IP');
                            }
                        });
                    }).on('error', (err) => {
                        clearTimeout(timeout);
                        resolve('网络错误');
                    });
                });
            } catch (error) {
                return '无法获取公网IP';
            }
        }
    },
    
    // 网络状态检查
    health: {
        // 检查端口是否开放
        checkPort: (port) => {
            return new Promise((resolve) => {
                const net = require('net');
                const socket = new net.Socket();
                
                socket.setTimeout(3000);
                
                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });
                
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });
                
                socket.on('error', () => {
                    socket.destroy();
                    resolve(false);
                });
                
                socket.connect(port, '127.0.0.1');
            });
        },
        
        // 检查网络连通性
        checkConnectivity: async () => {
            try {
                const https = require('https');
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve(false);
                    }, 5000);
                    
                    https.get('https://www.baidu.com', (res) => {
                        clearTimeout(timeout);
                        resolve(res.statusCode === 200);
                    }).on('error', () => {
                        clearTimeout(timeout);
                        resolve(false);
                    });
                });
            } catch (error) {
                return false;
            }
        }
    }
};

module.exports = networkConfig; 