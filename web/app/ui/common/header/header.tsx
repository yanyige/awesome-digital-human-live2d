'use client'

import { useEffect, useState } from "react";
import { useHeartbeatStore } from "@/app/lib/store";
import { HeadAlert } from "@/app/ui/common/alert";
import { PROJ_NAME, HEART_BEAT_ALERT, HEART_BEAT_CHECK_1S } from "@/app/lib/constants";
import { WindowMenu, PhoneMenu } from "./menu";
import Github from "./github";
import Link from "next/link";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { get_heatbeat_wss } from '@/app/lib/api';
import { usePathname } from 'next/navigation';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Card, CardHeader, CardBody, Divider } from "@nextui-org/react";

// 用户信息接口
interface UserInfo {
    username: string;
    attributes?: {
        [key: string]: string;
    };
}

// 获取cookie值的工具函数
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// 获取用户详细信息
function getUserInfo(): UserInfo | null {
    const username = getCookie('cas_user');
    if (!username) return null;
    
    // 尝试获取用户完整数据
    const userData = getCookie('cas_user_data');
    let attributes = {};
    
    if (userData) {
        try {
            const userDataObj = JSON.parse(decodeURIComponent(userData));
            attributes = userDataObj.attributes || {};
            console.log('[用户信息] 📋 加载用户属性:', attributes);
        } catch (e) {
            console.warn('[用户信息] ⚠️ 解析用户数据失败:', e);
        }
    } else {
        console.log('[用户信息] ℹ️ 未找到用户详细数据cookie');
    }
    
    return {
        username,
        attributes
    };
}

export default function Header() {
    const { heartbeat, setHeartbeat } = useHeartbeatStore();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    
    const { readyState } = useWebSocket(
        get_heatbeat_wss(),
        {
            shouldReconnect: () => true,
            heartbeat: {
                message: 'ping',
                returnMessage: 'pong',
                timeout: 3000, // 3s
                interval: HEART_BEAT_CHECK_1S,
            },
        }
    );
    const pathname = usePathname();
    const isAdmin = pathname === '/admin';

    useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            setHeartbeat(true);
        } else {
            setHeartbeat(false);
        }
    }, [readyState]);

    useEffect(() => {
        // 获取当前用户信息
        const info = getUserInfo();
        setUserInfo(info);
    }, []);

    const handleLogout = () => {
        // 使用window.location确保是浏览器导航，不是客户端路由
        window.location.href = '/auth/logout';
    };

    const handleLogoClick = () => {
        // 使用window.location确保是浏览器导航，不是客户端路由
        window.location.href = '/';
    };

    const handleUserClick = () => {
        onOpen();
    };

    return (
        <>
            <header className="text-gray-600 min-w-full h-min z-10">
                {heartbeat ? null : <HeadAlert message={HEART_BEAT_ALERT} />}
                <div className="flex flex-nowrap mx-auto p-1 md:p-5 flex-row items-center">
                    {/* 使用button而不是Link避免客户端路由 */}
                    <button onClick={handleLogoClick} className="flex title-font font-medium items-center text-gray-900 hover:text-gray-600">
                        <img src="/icons/app_icon.svg" className="w-8 h-8 md:w-10 md:h-10 text-white p-2 rounded-full border-2 border-black" />
                        <span className="ml-3 text-sm md:text-xl text-nowrap">{PROJ_NAME}</span>
                    </button>

                    <div className="hidden md:block mr-auto ml-2 md:ml-4 pl-2 md:pl-4 border-l border-gray-400">
                        <WindowMenu isAdmin={isAdmin}/>
                    </div>
                    <div className="md:hidden ml-auto">
                        <PhoneMenu />
                    </div>
                    
                    {/* 桌面端用户信息 */}
                    {userInfo && (
                        <div className="hidden md:flex items-center space-x-4 ml-4">
                            <button
                                onClick={handleUserClick}
                                className="text-sm text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-3 py-1 rounded transition-colors"
                            >
                                👤 {userInfo.username}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-600 hover:text-red-800 border border-red-600 hover:border-red-800 px-3 py-1 rounded transition-colors"
                            >
                                登出
                            </button>
                        </div>
                    )}
                    
                    {/* 移动端用户信息 */}
                    {userInfo && (
                        <div className="md:hidden flex items-center space-x-2 ml-2">
                            <button
                                onClick={handleUserClick}
                                className="text-xs text-blue-600 border border-blue-600 px-2 py-1 rounded max-w-20 truncate"
                            >
                                👤 {userInfo.username}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="text-xs text-red-600 border border-red-600 px-2 py-1 rounded"
                            >
                                登出
                            </button>
                        </div>
                    )}
                    
                    {/* <div className="hidden md:block">
                        <Github />
                    </div> */}
                </div>
            </header>

            {/* 用户信息模态框 */}
            <Modal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange}
                size="lg"
                placement="center"
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">👤</span>
                                    <span>用户信息</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <Card className="w-full">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">👤</span>
                                            <h4 className="text-lg font-semibold">基本信息</h4>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="pt-0">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <span>🏷️</span>
                                                    <span>用户名：</span>
                                                </span>
                                                <span className="font-medium">{userInfo?.username || 'N/A'}</span>
                                            </div>
                                            
                                            {userInfo?.attributes && Object.keys(userInfo.attributes).length > 0 ? (
                                                <>
                                                    <Divider />
                                                    <div className="space-y-2">
                                                        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                                            <span>📋</span>
                                                            <span>详细信息</span>
                                                        </h5>
                                                        {Object.entries(userInfo.attributes).map(([key, value]) => {
                                                            // 获取字段的图标和中文名
                                                            const getFieldInfo = (key: string) => {
                                                                const fieldMap: { [key: string]: { icon: string; name: string } } = {
                                                                    'email': { icon: '📧', name: '邮箱' },
                                                                    'phone': { icon: '📱', name: '电话' },
                                                                    'mobile': { icon: '📱', name: '手机' },
                                                                    'name': { icon: '👨‍💼', name: '姓名' },
                                                                    'realName': { icon: '👨‍💼', name: '真实姓名' },
                                                                    'department': { icon: '🏢', name: '部门' },
                                                                    'title': { icon: '💼', name: '职位' },
                                                                    'organization': { icon: '🏛️', name: '机构' },
                                                                    'role': { icon: '🎭', name: '角色' },
                                                                    'studentId': { icon: '🎓', name: '学号' },
                                                                    'employeeId': { icon: '🆔', name: '工号' },
                                                                    'gender': { icon: '⚧️', name: '性别' },
                                                                    'birthday': { icon: '🎂', name: '生日' },
                                                                    'address': { icon: '🏠', name: '地址' }
                                                                };
                                                                return fieldMap[key] || { icon: '📝', name: key };
                                                            };
                                                            
                                                            const fieldInfo = getFieldInfo(key);
                                                            
                                                            return (
                                                                <div key={key} className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-600 flex items-center gap-1">
                                                                        <span>{fieldInfo.icon}</span>
                                                                        <span>{fieldInfo.name}：</span>
                                                                    </span>
                                                                    <span className="font-medium text-right max-w-48 truncate" title={value}>
                                                                        {value || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-6 text-gray-500">
                                                    <span className="text-3xl mb-2 block">📄</span>
                                                    <p>暂无详细信息</p>
                                                    <p className="text-xs mt-1">CAS系统未提供额外属性</p>
                                                </div>
                                            )}
                                            
                                            <Divider />
                                            <div className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                                                <span>🔐</span>
                                                <span>登录方式：CAS单点登录</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={handleLogout}>
                                    登出
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                    关闭
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
