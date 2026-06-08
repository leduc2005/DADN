/**
 * GlobalChatbot.tsx - Trợ lý AI Đồ Án (Global Floating Component)
 *
 * Component này nổi trên MỌI màn hình (trừ Auth), cho phép người dùng
 * hỏi đáp về sách Cơ sở thiết kế máy bất cứ lúc nào.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native';

import EventSource from 'react-native-sse';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CHAT_PANEL_HEIGHT = SCREEN_HEIGHT * 0.65;

// Các màn hình Auth → Ẩn nút Chatbot
const AUTH_SCREENS = ['Login', 'Register', 'ForgotPassword', 'VerifyCode', 'ResetPassword'];

// ── Kiểu dữ liệu ──
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface GlobalChatbotProps {
  currentRoute: string;
}

// ── Tin nhắn chào mừng ──
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: 'Chào bạn! 👋 Mình là Trợ lý AI Đồ Án.\n\nBạn có thể hỏi mình về công thức, thông số trong sách Cơ sở thiết kế máy nhé!',
  isUser: false,
  timestamp: new Date(),
};

// ── Hàm tạo HTML với KaTeX + Marked ──
// Dùng window.onload để đảm bảo tất cả script CDN tải xong trước khi render
function buildMathHTML(text: string): string {
  // Escape cho JSON.stringify bên trong template
  const escapedText = JSON.stringify(text);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      padding: 10px 12px;
      background-color: #f3f4f6;
      border-radius: 16px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    p { margin-bottom: 8px; }
    p:last-child { margin-bottom: 0; }
    ul, ol { padding-left: 20px; margin-bottom: 8px; }
    li { margin-bottom: 4px; }
    .katex { font-size: 1.05em; }
    .katex-display { margin: 10px 0; overflow-x: auto; overflow-y: hidden; }
    pre { background: #e5e7eb; padding: 8px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
    code { font-family: monospace; font-size: 13px; }
    strong { font-weight: 700; }
    h1,h2,h3,h4 { margin: 10px 0 6px; font-weight: 700; }
    h1 { font-size: 18px; } h2 { font-size: 16px; } h3 { font-size: 15px; }
    blockquote { border-left: 3px solid #6366f1; padding-left: 10px; color: #4b5563; margin: 8px 0; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-size: 13px; }
    th { background: #e5e7eb; font-weight: 600; }
    a { color: #6366f1; }
    .loading { color: #9ca3af; font-style: italic; }
  </style>
</head>
<body>
  <div id="content"><p class="loading">Đang tải...</p></div>

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
  <script>
    // Đợi tất cả script tải xong
    window.onload = function() {
      try {
        var rawText = ${escapedText};
        
        // Bảo vệ các block math $$ ... $$ trước khi Marked xử lý
        var mathBlocks = [];
        var idx = 0;
        
        // Bảo vệ block math $$...$$
        rawText = rawText.replace(/\\$\\$([\\s\\S]*?)\\$\\$/g, function(m) {
          var key = '@@MATH_BLOCK_' + idx + '@@';
          mathBlocks.push({ key: key, val: m });
          idx++;
          return key;
        });
        
        // Bảo vệ inline math $...$
        rawText = rawText.replace(/\\$([^\\$\\n]+?)\\$/g, function(m) {
          var key = '@@MATH_INLINE_' + idx + '@@';
          mathBlocks.push({ key: key, val: m });
          idx++;
          return key;
        });
        
        // Parse Markdown
        var html = marked.parse(rawText);
        
        // Khôi phục các công thức
        for (var i = 0; i < mathBlocks.length; i++) {
          html = html.split(mathBlocks[i].key).join(mathBlocks[i].val);
        }
        
        document.getElementById('content').innerHTML = html;

        // Render KaTeX
        if (typeof renderMathInElement === 'function') {
          renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\\\(', right: '\\\\)', display: false },
              { left: '\\\\[', right: '\\\\]', display: true }
            ],
            throwOnError: false
          });
        }
      } catch(e) {
        document.getElementById('content').innerHTML = ${escapedText}.replace(/\\n/g, '<br/>');
      }
      
      // Gửi chiều cao về React Native
      function sendHeight() {
        var h = document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
      }
      sendHeight();
      setTimeout(sendHeight, 500);
      setTimeout(sendHeight, 1500);
    };
  </script>
</body>
</html>`;
}

// ── Component hiển thị AI bằng WebView để Render Toán học ──
const AIMessageWebView = React.memo(({ text }: { text: string }) => {
  const [webViewHeight, setWebViewHeight] = useState(60);
  const htmlContent = buildMathHTML(text);

  return (
    <View style={{ width: SCREEN_WIDTH * 0.72, height: webViewHeight, minHeight: 50 }}>
      <WebView
        source={{ html: htmlContent }}
        style={{ width: '100%', height: webViewHeight, backgroundColor: 'transparent', opacity: 0.99 }}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'height' && data.value > 0) {
              setWebViewHeight(data.value + 10);
            }
          } catch (e) {
            const h = parseInt(event.nativeEvent.data);
            if (!isNaN(h) && h > 0) setWebViewHeight(h + 10);
          }
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

export default function GlobalChatbot({ currentRoute }: GlobalChatbotProps) {
  // ── State ──
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ── Animation refs ──
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const typingOpacity = useRef(new Animated.Value(0.3)).current;
  const flatListRef = useRef<FlatList>(null);

  // Ẩn trên màn hình Auth
  const isVisible = !AUTH_SCREENS.includes(currentRoute);

  // ── Keyboard listeners ──
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Typing dots animation ──
  useEffect(() => {
    if (!isTyping) {
      typingOpacity.setValue(0.3);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(typingOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(typingOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isTyping, typingOpacity]);

  // ── Toggle khung chat ──
  const toggleChat = useCallback(() => {
    const opening = !isOpen;

    // Hiệu ứng "bật nảy" cho nút FAB
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, damping: 12 }),
    ]).start();

    // Trượt khung chat lên/xuống
    Animated.spring(slideAnim, {
      toValue: opening ? 1 : 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 200,
    }).start();

    setIsOpen(opening);
    if (!opening) Keyboard.dismiss();
  }, [isOpen, slideAnim, fabScale]);

  // ── Gửi tin nhắn ──
  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    // 1. Thêm bong bóng User
    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      isUser: true,
      timestamp: new Date(),
    };
    
    // Tạo sẵn một bong bóng AI rỗng để hứng dữ liệu
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      text: '',
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInputText('');
    Keyboard.dismiss();

    // 2. Bật trạng thái chờ (3 dấu chấm nhấp nháy)
    setIsTyping(true);

    // 3. Gọi API bằng Server-Sent Events (SSE)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.123.10:8000';
    
    const es = new EventSource(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: trimmed }),
    });

    es.addEventListener('message', (event: any) => {
      setIsTyping(false); // Có data về là tắt Typing Indicator

      if (event.data === '[DONE]') {
        es.close();
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        if (parsed.text) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMsgId ? { ...msg, text: msg.text + parsed.text } : msg
            )
          );
        }
      } catch (e) {
        console.error('SSE JSON Parse error:', e);
      }
    });

    es.addEventListener('error', (error: any) => {
      console.error('SSE Error:', error);
      setIsTyping(false);
      es.close();
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMsgId && msg.text === ''
            ? { ...msg, text: '❌ Lỗi kết nối tới Server RAG. Hãy chắc chắn Server đang chạy và bạn cấu hình đúng IP.' } 
            : msg
        )
      );
    });

  }, [inputText, isTyping]);

  // Tự cuộn xuống cuối khi có tin nhắn mới hoặc khi mở bàn phím
  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages.length, keyboardHeight]);

  // ── Render từng bong bóng ──
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {!item.isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          item.isUser ? styles.bubbleUser : styles.bubbleAI,
        ]}
      >
        {item.isUser ? (
          <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
            {item.text}
          </Text>
        ) : item.text === '' ? (
          <Text style={[styles.bubbleText, styles.bubbleTextAI, { fontStyle: 'italic', color: '#9ca3af' }]}>
            ...
          </Text>
        ) : (
          <AIMessageWebView text={item.text} />
        )}
      </View>
    </View>
  );

  // ── Tính vị trí trượt ──
  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CHAT_PANEL_HEIGHT + 100, 0],
  });

  if (!isVisible) return null;

  return (
    <>
      {/* ── NÚT NỔI (FAB) ── */}
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity style={[styles.fab, isOpen && styles.fabOpen]} onPress={toggleChat} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>{isOpen ? '✕' : '💬'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── KHUNG CHAT ── */}
      <Animated.View
        style={[
          styles.chatPanel,
          {
            transform: [{ translateY: panelTranslateY }],
            // Đẩy panel lên khi bàn phím mở
            bottom: keyboardHeight > 0 ? keyboardHeight : 0,
          }
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <Text style={{ fontSize: 20 }}>🤖</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Trợ lý AI Đồ Án</Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerSubtitle}>Hỏi đáp Cơ sở TKCK</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={toggleChat} style={styles.headerCloseBtn}>
            <Text style={styles.headerCloseBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <Animated.View style={[styles.typingRow, { opacity: typingOpacity }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🤖</Text>
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>● ● ●</Text>
              <Text style={styles.typingLabel}>Đang trích xuất tài liệu...</Text>
            </View>
          </Animated.View>
        )}

        {/* Thanh nhập liệu */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về công thức, thông số..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.7}
          >
            <Text style={styles.sendBtnIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

// ════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════
const styles = StyleSheet.create({
  // ── FAB ──
  fabWrapper: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabOpen: {
    backgroundColor: '#4f46e5',
  },
  fabIcon: {
    fontSize: 24,
    color: '#ffffff',
  },

  // ── Chat Panel ──
  chatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CHAT_PANEL_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 998,
    overflow: 'hidden',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fafbfc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCloseBtnText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },

  // ── Message List ──
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // ── Message Bubbles ──
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAI: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 4,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTextAI: {
    color: '#1f2937',
  },

  // ── Typing Indicator ──
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    fontSize: 10,
    color: '#6366f1',
    letterSpacing: 2,
  },
  typingLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },

  // ── Input Bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendBtnIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
});
