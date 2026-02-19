import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Translation resources
const resources = {
  en: {
    translation: {
      // Onboarding
      onboarding: {
        welcome: 'Welcome to LingoChat',
        subtitle: 'Break language barriers instantly',
        getStarted: 'Get Started',
        skip: 'Skip',
        
        slide1: {
          title: 'Instant Translation',
          description: 'Chat with anyone in any language. Messages are automatically translated in real-time.',
        },
        slide2: {
          title: 'Group Meetings',
          description: 'Create multilingual group chats. Everyone sees messages in their preferred language.',
        },
        slide3: {
          title: 'Privacy First',
          description: 'Your messages auto-delete after 24 hours. Your privacy is our priority.',
        },
      },
      
      // Auth
      auth: {
        phoneNumber: 'Phone Number',
        enterPhone: 'Enter your phone number',
        sendCode: 'Send Code',
        verifyCode: 'Verify Code',
        enterCode: 'Enter the 6-digit code',
        resendCode: 'Resend Code',
        verifying: 'Verifying...',
        continue: 'Continue',
        verifyTitle: 'Verify Code',
        verifyDescription: 'Enter the 6-digit verification code sent to',
        resendTimer: 'Resend code in',
        invalidPhone: 'Invalid phone number',
        invalidCode: 'Invalid verification code',
        otpSent: 'OTP sent successfully',
        otpFailed: 'Failed to send OTP',
        verifyFailed: 'Failed to verify OTP',
        privacyNotice: 'By continuing, you agree to our',
        privacyPolicy: 'Privacy Policy',
        and: 'and',
        termsOfService: 'Terms of Service',
        companyInfo: 'LingoChat is a product of TrairX Technology O.Ü',
        internationalRates: 'International rates may apply. Message and data rates also apply.',
        selectCountry: 'Select Country',
        appTagline: 'Break language barriers, connect with the world',
      },
      
      // Profile Setup
      profileSetup: {
        title: 'Create Your Profile',
        username: 'Username',
        enterUsername: 'Choose a username',
        language: 'Preferred Language',
        selectLanguage: 'Select your language',
        continue: 'Continue',
        usernameError: 'Username must be 3-20 characters',
        usernameTaken: 'Username is already taken',
      },
      
      // Common
      common: {
        cancel: 'Cancel',
        delete: 'Delete',
        save: 'Save',
        edit: 'Edit',
        send: 'Send',
        back: 'Back',
        next: 'Next',
        done: 'Done',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
      },
      
      // Tabs
      tabs: {
        chats: 'Chats',
        groups: 'Groups',
        contacts: 'Contacts',
        profile: 'Profile',
      },
      
      // Chats
      chats: {
        title: 'Chats',
        newChat: 'New Chat',
        search: 'Search chats or messages...',
        noChats: 'No chats yet',
        startChat: 'Start Chat',
        deleteChat: 'Delete Chat',
        deleteConfirm: 'Are you sure you want to delete this chat?',
        online: 'Online',
        typing: 'typing...',
      },
      
      // Messages
      messages: {
        typeMessage: 'Type a message...',
        reply: 'Reply',
        block: 'Block',
        delete: 'Delete',
        copy: 'Copy',
        forward: 'Forward',
        edited: 'Edited',
        deleted: 'This message was deleted',
        translating: 'Translating...',
      },
      
      // Groups
      groups: {
        title: 'Groups',
        newGroup: 'New Group',
        groupName: 'Group Name',
        enterGroupName: 'Enter group name',
        createGroup: 'Create Group',
        addParticipants: 'Add Participants',
        participants: 'Participants',
        leaveGroup: 'Leave Group',
        leaveConfirm: 'Are you sure you want to leave this group?',
        admin: 'Admin',
        you: 'You',
      },
      
      // Profile
      profile: {
        title: 'Profile',
        editProfile: 'Edit Profile',
        username: 'Username',
        phoneNumber: 'Phone Number',
        language: 'Language',
        settings: 'Settings',
        privacy: 'Privacy',
        notifications: 'Notifications',
        help: 'Help & Support',
        about: 'About',
        logout: 'Logout',
        deleteAccount: 'Delete Account Permanently',
        deleteAccountConfirm: 'Are you sure? This action cannot be undone.',
        deleteAccountFinal: 'Yes, Delete My Account',
        
        autoDelete: {
          title: 'Auto-Delete Messages',
          description: 'Messages will be automatically deleted',
          after6h: '6 Hours',
          after12h: '12 Hours',
          after24h: '24 Hours',
        },
        
        privacy: {
          readReceipts: 'Read Receipts',
          onlineStatus: 'Online Status',
          profilePhoto: 'Profile Photo',
        },
      },
      
      // Blocking
      blocking: {
        blockUser: 'Block User',
        blockConfirm: 'Are you sure you want to block this user? You will no longer receive messages from them.',
        blocked: 'User Blocked',
        unblock: 'Unblock',
      },
      
      // Media
      media: {
        camera: 'Camera',
        gallery: 'Gallery',
        document: 'Document',
        location: 'Location',
        contact: 'Contact',
        sending: 'Sending...',
      },
      
      // Errors
      errors: {
        networkError: 'Network error. Please check your connection.',
        serverError: 'Server error. Please try again later.',
        invalidPhone: 'Invalid phone number',
        invalidCode: 'Invalid verification code',
        userNotFound: 'User not found',
        permissionDenied: 'Permission denied',
      },
    },
  },
  tr: {
    translation: {
      // Onboarding
      onboarding: {
        welcome: 'LingoChat\'e Hoş Geldiniz',
        subtitle: 'Dil engellerini anında aşın',
        getStarted: 'Başlayın',
        skip: 'Geç',
        
        slide1: {
          title: 'Anında Çeviri',
          description: 'Herhangi bir dilde herhangi biriyle sohbet edin. Mesajlar otomatik olarak gerçek zamanlı çevrilir.',
        },
        slide2: {
          title: 'Grup Toplantıları',
          description: 'Çok dilli grup sohbetleri oluşturun. Herkes mesajları kendi dilinde görür.',
        },
        slide3: {
          title: 'Gizlilik Öncelikli',
          description: 'Mesajlarınız 24 saat sonra otomatik silinir. Gizliliğiniz önceliğimizdir.',
        },
      },
      
      // Auth
      auth: {
        phoneNumber: 'Telefon Numarası',
        enterPhone: 'Telefon numaranızı girin',
        sendCode: 'Kod Gönder',
        verifyCode: 'Kodu Doğrula',
        enterCode: '6 haneli kodu girin',
        resendCode: 'Kodu Tekrar Gönder',
        verifying: 'Doğrulanıyor...',
        continue: 'Devam Et',
        verifyTitle: 'Kodu Doğrulayın',
        verifyDescription: 'numarasına gönderilen 6 haneli doğrulama kodunu girin',
        resendTimer: 'Kodu tekrar gönder',
        invalidPhone: 'Geçersiz telefon numarası',
        invalidCode: 'Geçersiz doğrulama kodu',
        otpSent: 'OTP başarıyla gönderildi',
        otpFailed: 'OTP gönderilemedi',
        verifyFailed: 'OTP doğrulanamadı',
        privacyNotice: 'Devam ederek',
        privacyPolicy: 'Gizlilik Politikası',
        and: 've',
        termsOfService: 'Kullanım Şartları',
        companyInfo: 'LingoChat, TrairX Technology O.Ü şirketinin ürünüdür',
        internationalRates: 'Uluslararası ücretler uygulanabilir. Mesaj ve veri ücretleri de geçerlidir.',
        selectCountry: 'Ülke Seçin',
        appTagline: 'Dil bariyerlerini kaldırın, dünyayla bağlantı kurun',
      },
      
      // Profile Setup
      profileSetup: {
        title: 'Profilinizi Oluşturun',
        username: 'Kullanıcı Adı',
        enterUsername: 'Bir kullanıcı adı seçin',
        language: 'Tercih Edilen Dil',
        selectLanguage: 'Dilinizi seçin',
        continue: 'Devam',
        usernameError: 'Kullanıcı adı 3-20 karakter olmalı',
        usernameTaken: 'Kullanıcı adı zaten alınmış',
      },
      
      // Common
      common: {
        cancel: 'İptal',
        delete: 'Sil',
        save: 'Kaydet',
        edit: 'Düzenle',
        send: 'Gönder',
        back: 'Geri',
        next: 'İleri',
        done: 'Tamam',
        loading: 'Yükleniyor...',
        error: 'Hata',
        success: 'Başarılı',
        confirm: 'Onayla',
        yes: 'Evet',
        no: 'Hayır',
      },
      
      // Tabs
      tabs: {
        chats: 'Sohbetler',
        groups: 'Gruplar',
        contacts: 'Kişiler',
        profile: 'Profil',
      },
      
      // Chats
      chats: {
        title: 'Sohbetler',
        newChat: 'Yeni Sohbet',
        search: 'Sohbet veya mesaj ara...',
        noChats: 'Henüz sohbet yok',
        startChat: 'Sohbet Başlat',
        deleteChat: 'Sohbeti Sil',
        deleteConfirm: 'Bu sohbeti silmek istediğinizden emin misiniz?',
        online: 'Çevrimiçi',
        typing: 'yazıyor...',
      },
      
      // Messages
      messages: {
        typeMessage: 'Bir mesaj yazın...',
        reply: 'Yanıtla',
        block: 'Engelle',
        delete: 'Sil',
        copy: 'Kopyala',
        forward: 'İlet',
        edited: 'Düzenlendi',
        deleted: 'Bu mesaj silindi',
        translating: 'Çevriliyor...',
      },
      
      // Groups
      groups: {
        title: 'Gruplar',
        newGroup: 'Yeni Grup',
        groupName: 'Grup Adı',
        enterGroupName: 'Grup adı girin',
        createGroup: 'Grup Oluştur',
        addParticipants: 'Katılımcı Ekle',
        participants: 'Katılımcılar',
        leaveGroup: 'Gruptan Ayrıl',
        leaveConfirm: 'Bu gruptan ayrılmak istediğinizden emin misiniz?',
        admin: 'Yönetici',
        you: 'Siz',
      },
      
      // Profile
      profile: {
        title: 'Profil',
        editProfile: 'Profili Düzenle',
        username: 'Kullanıcı Adı',
        phoneNumber: 'Telefon Numarası',
        language: 'Dil',
        settings: 'Ayarlar',
        privacy: 'Gizlilik',
        notifications: 'Bildirimler',
        help: 'Yardım ve Destek',
        about: 'Hakkında',
        logout: 'Çıkış Yap',
        deleteAccount: 'Hesabı Kalıcı Olarak Sil',
        deleteAccountConfirm: 'Emin misiniz? Bu işlem geri alınamaz.',
        deleteAccountFinal: 'Evet, Hesabımı Sil',
        
        autoDelete: {
          title: 'Mesaj Silme Süresi',
          description: 'Mesajlar otomatik olarak silinecek',
          after6h: '6 Saat Sonra',
          after12h: '12 Saat Sonra',
          after24h: '24 Saat Sonra',
        },
        
        privacy: {
          readReceipts: 'Okundu Bilgisi',
          onlineStatus: 'Çevrimiçi Durumu',
          profilePhoto: 'Profil Fotoğrafı',
        },
      },
      
      // Blocking
      blocking: {
        blockUser: 'Kullanıcıyı Engelle',
        blockConfirm: 'Bu kullanıcıyı engellemek istediğinizden emin misiniz? Artık bu kullanıcıdan mesaj alamayacaksınız.',
        blocked: 'Kullanıcı Engellendi',
        unblock: 'Engeli Kaldır',
      },
      
      // Media
      media: {
        camera: 'Kamera',
        gallery: 'Galeri',
        document: 'Belge',
        location: 'Konum',
        contact: 'Kişi',
        sending: 'Gönderiliyor...',
      },
      
      // Errors
      errors: {
        networkError: 'Ağ hatası. Lütfen bağlantınızı kontrol edin.',
        serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
        invalidPhone: 'Geçersiz telefon numarası',
        invalidCode: 'Geçersiz doğrulama kodu',
        userNotFound: 'Kullanıcı bulunamadı',
        permissionDenied: 'İzin reddedildi',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default to English for Apple Store
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
