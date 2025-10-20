// إعداد Supabase - يجب أن يكون أول شيء
console.log('🚀 بدء تحميل script.js');

const SUPABASE_URL = 'https://mlivfrsfhcjybskefwpp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saXZmcnNmaGNqeWJza2Vmd3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDcwMzksImV4cCI6MjA3NjQ4MzAzOX0.P5g8ZAIjv3RVmeGSpd7OqhiHRn5tHN6R5W1gA-8dbUU';

// التحقق من تحميل مكتبة Supabase
if (typeof supabase === 'undefined') {
    console.error('❌ مكتبة Supabase غير محملة!');
    alert('خطأ: مكتبة Supabase غير محملة. تأكد من الاتصال بالإنترنت');
} else {
    console.log('✅ مكتبة Supabase محملة بنجاح');
}

// إنشاء عميل Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ تم تهيئة Supabase Client:', supabaseClient);

let currentUser = null;
let currentConversation = null;

// انتظر حتى تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ الصفحة محملة بالكامل - جاهز للتشغيل');
    
    // الحصول على عناصر DOM
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const googleLogin = document.getElementById('googleLogin');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const conversationsContainer = document.getElementById('conversationsContainer');
    const chatModal = document.getElementById('chatModal');
    const chatWithUser = document.getElementById('chatWithUser');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const closeChat = document.getElementById('closeChat');

    // التحقق من وجود جميع العناصر
    console.log('🔍 فحص عناصر DOM:');
    console.log('- زر Google:', googleLogin);
    console.log('- شاشة التسجيل:', authScreen);
    console.log('- الشاشة الرئيسية:', mainScreen);

    if (!googleLogin) {
        console.error('❌ زر Google غير موجود في الصفحة!');
        return;
    }

    // إضافة event listener للزر مع تأكيد العمل
    googleLogin.addEventListener('click', handleGoogleLogin);
    console.log('✅ تم إضافة event listener لزر Google');

    // دالة تسجيل الدخول بحساب Google
    async function handleGoogleLogin() {
        console.log('🎯 تم النقر على زر التسجيل بنجاح!');
        
        try {
            console.log('🔄 جاري الاتصال بـ Supabase...');
            
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
            });
            
            if (error) {
                console.error('❌ خطأ من Supabase:', error);
                alert('خطأ في التسجيل: ' + error.message);
                return;
            }
            
            console.log('✅ نجح تحضير التسجيل:', data);
            
        } catch (error) {
            console.error('💥 خطأ كامل في التسجيل:', error);
            alert('حدث خطأ غير متوقع: ' + error.message);
        }
    }

    // تسجيل الخروج
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
    });

    // البحث عن مستخدم
    searchBtn.addEventListener('click', searchUser);

    // إرسال رسالة
    sendMessageBtn.addEventListener('click', sendMessage);

    // إغلاق نافذة المحادثة
    closeChat.addEventListener('click', () => {
        chatModal.classList.add('hidden');
    });

    // تفعيل إرسال الرسالة بالزر Enter
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // الاستماع لتغير حالة المصادقة
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 تغير حالة المصادقة:', event, session);
        
        if (session?.user) {
            currentUser = session.user;
            await handleUserLogin();
        } else {
            showAuthScreen();
        }
    });

    // معالجة تسجيل الدخول
    async function handleUserLogin() {
        try {
            console.log('👤 معالجة تسجيل دخول المستخدم:', currentUser.email);
            
            // حفظ بيانات المستخدم في قاعدة البيانات
            const { error } = await supabaseClient
                .from('users')
                .upsert({
                    id: currentUser.id,
                    email: currentUser.email,
                    full_name: currentUser.user_metadata.full_name,
                    avatar_url: currentUser.user_metadata.avatar_url
                });

            if (error) throw error;

            showMainScreen();
            loadUserConversations();
        } catch (error) {
            console.error('خطأ في حفظ بيانات المستخدم:', error);
        }
    }

    // عرض شاشة التسجيل
    function showAuthScreen() {
        authScreen.classList.remove('hidden');
        mainScreen.classList.add('hidden');
        chatModal.classList.add('hidden');
    }

    // عرض الشاشة الرئيسية
    function showMainScreen() {
        authScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        
        // تحديث معلومات المستخدم
        if (currentUser.user_metadata.avatar_url) {
            userAvatar.src = currentUser.user_metadata.avatar_url;
        }
        userName.textContent = currentUser.user_metadata.full_name || currentUser.email;
    }

    // البحث عن مستخدم
    async function searchUser() {
        const email = searchInput.value.trim();
        if (!email) return;

        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;

            if (data) {
                await startConversation(data);
            } else {
                alert('لم يتم العثور على مستخدم بهذا البريد');
            }
        } catch (error) {
            console.error('خطأ في البحث:', error);
            alert('لم يتم العثور على مستخدم بهذا البريد');
        }
    }

    // بدء محادثة جديدة
    async function startConversation(targetUser) {
        try {
            // البحث عن محادثة موجودة
            const { data: existingConversation, error: convError } = await supabaseClient
                .from('conversations')
                .select('*')
                .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${targetUser.id}),and(user1_id.eq.${targetUser.id},user2_id.eq.${currentUser.id})`)
                .single();

            if (convError && convError.code !== 'PGRST116') throw convError;

            if (existingConversation) {
                currentConversation = existingConversation;
            } else {
                // إنشاء محادثة جديدة
                const { data: newConversation, error: newConvError } = await supabaseClient
                    .from('conversations')
                    .insert([
                        {
                            user1_id: currentUser.id,
                            user2_id: targetUser.id
                        }
                    ])
                    .select()
                    .single();

                if (newConvError) throw newConvError;
                currentConversation = newConversation;
            }

            openChat(targetUser);
            loadMessages();
        } catch (error) {
            console.error('خطأ في بدء المحادثة:', error);
        }
    }

    // فتح نافذة المحادثة
    function openChat(targetUser) {
        chatWithUser.textContent = `المحادثة مع ${targetUser.full_name || targetUser.email}`;
        chatModal.classList.remove('hidden');
        messagesContainer.innerHTML = '';
    }

    // تحميل الرسائل
    async function loadMessages() {
        try {
            const { data: messages, error } = await supabaseClient
                .from('messages')
                .select('*')
                .eq('conversation_id', currentConversation.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            messagesContainer.innerHTML = '';
            messages.forEach(message => {
                displayMessage(message);
            });
        } catch (error) {
            console.error('خطأ في تحميل الرسائل:', error);
        }
    }

    // عرض رسالة
    function displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender_id === currentUser.id ? 'sent' : 'received'}`;
        messageDiv.textContent = message.message_text;
        
        // إضافة الوقت
        const timeSpan = document.createElement('span');
        timeSpan.style.display = 'block';
        timeSpan.style.fontSize = '0.8em';
        timeSpan.style.opacity = '0.7';
        timeSpan.textContent = new Date(message.created_at).toLocaleTimeString('ar-EG');
        messageDiv.appendChild(timeSpan);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // إرسال رسالة
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        try {
            const { data, error } = await supabaseClient
                .from('messages')
                .insert([
                    {
                        conversation_id: currentConversation.id,
                        sender_id: currentUser.id,
                        message_text: text
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            displayMessage(data);
            messageInput.value = '';
            
            // تحديث قائمة المحادثات
            loadUserConversations();
        } catch (error) {
            console.error('خطأ في إرسال الرسالة:', error);
        }
    }

    // تحميل محادثات المستخدم
    async function loadUserConversations() {
        try {
            const { data: conversations, error } = await supabaseClient
                .from('conversations')
                .select(`
                    *,
                    user1:users!conversations_user1_id_fkey(*),
                    user2:users!conversations_user2_id_fkey(*),
                    messages!messages_conversation_id_fkey(*)
                `)
                .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

            if (error) throw error;

            displayConversations(conversations);
        } catch (error) {
            console.error('خطأ في تحميل المحادثات:', error);
        }
    }

    // عرض المحادثات
    function displayConversations(conversations) {
        conversationsContainer.innerHTML = '';

        conversations.forEach(conversation => {
            const otherUser = conversation.user1_id === currentUser.id ? conversation.user2 : conversation.user1;
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];

            const conversationDiv = document.createElement('div');
            conversationDiv.className = 'conversation-item';
            conversationDiv.innerHTML = `
                <strong>${otherUser.full_name || otherUser.email}</strong>
                <br>
                <small>${otherUser.email}</small>
                ${lastMessage ? `<p>${lastMessage.message_text}</p>` : '<p>بدء محادثة جديدة</p>'}
            `;

            conversationDiv.addEventListener('click', () => {
                currentConversation = conversation;
                openChat(otherUser);
                loadMessages();
            });

            conversationsContainer.appendChild(conversationDiv);
        });
    }

    // إضافة خدمة عامل لمراقبة الرسائل الجديدة
    supabaseClient
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload) => {
          // إذا كانت الرسالة الجديدة في المحادثة الحالية
          if (currentConversation && payload.new.conversation_id === currentConversation.id) {
            displayMessage(payload.new);
          }
          // تحديث قائمة المحادثات في جميع الأحوال
          loadUserConversations();
        }
      )
      .subscribe();

    console.log('🎉 تم إعداد جميع الوظائف بنجاح!');
});

console.log('✅ انتهى تحميل script.js - بانتظار تحميل الصفحة');