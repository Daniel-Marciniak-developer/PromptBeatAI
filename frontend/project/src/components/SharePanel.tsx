import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { 
  X, 
  Share2, 
  Copy, 
  Mail, 
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Link,
  QrCode,
  Download,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface ShareItem {
  id: string;
  projectId: string;
  projectName: string;
  shareUrl: string;
  shareType: 'link' | 'social' | 'email' | 'qr';
  platform?: string;
  createdAt: Date;
  clicks: number;
  isActive: boolean;
}

interface SharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject?: {
    id: string;
    name: string;
    prompt: string;
    audioUrl?: string;
  };
}

const SharePanel: React.FC<SharePanelProps> = ({
  isOpen,
  onClose,
  currentProject
}) => {

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'share'>('share');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);



  const generateShareUrl = (projectId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${projectId}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
      

    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    if (!currentProject) return;

    const shareUrl = generateShareUrl(currentProject.id);
    const text = `Check out this amazing AI-generated music: "${currentProject.name}"`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
      

    }
  };

  const shareViaEmail = () => {
    if (!currentProject) return;

    const shareUrl = generateShareUrl(currentProject.id);
    const subject = `Check out this AI-generated music: ${currentProject.name}`;
    const body = `Hi!\n\nI wanted to share this amazing AI-generated music track with you:\n\n"${currentProject.name}"\n\nPrompt: ${currentProject.prompt}\n\nListen here: ${shareUrl}\n\nCreated with PromptBeat AI`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;


  };

  const generateQRCode = async () => {
    if (!currentProject) return;

    const shareUrl = generateShareUrl(currentProject.id);

    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrDataUrl);
      setShowQrModal(true);


    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };



  if (!isOpen) return null;

  const shareUrl = currentProject ? generateShareUrl(currentProject.id) : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Share Music</h2>
                <p className="text-white/60 text-sm">
                  {currentProject ? `Share "${currentProject.name}"` : 'Share your music with others'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>


        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
              {!currentProject ? (
                <div className="text-center py-8">
                  <Share2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No project selected to share</p>
                </div>
              ) : (
                <>
                  {/* Direct Link */}
                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Direct Link
                    </h3>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(shareUrl, 'Link')}
                          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-colors"
                        >
                          {copiedText === 'Link' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Social Media</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => shareToSocial('twitter')}
                        className="flex items-center gap-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 p-3 rounded-lg transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                        Twitter
                      </button>
                      <button
                        onClick={() => shareToSocial('facebook')}
                        className="flex items-center gap-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 p-3 rounded-lg transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                        Facebook
                      </button>
                      <button
                        onClick={() => shareToSocial('whatsapp')}
                        className="flex items-center gap-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 p-3 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => shareToSocial('telegram')}
                        className="flex items-center gap-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 p-3 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Telegram
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Email</h3>
                    <button
                      onClick={shareViaEmail}
                      className="w-full flex items-center justify-center gap-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 p-3 rounded-lg transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      Share via Email
                    </button>
                  </div>

                  {/* QR Code */}
                  <div>
                    <h3 className="text-white font-medium mb-3">QR Code</h3>
                    <button
                      onClick={generateQRCode}
                      className="w-full flex items-center justify-center gap-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 p-3 rounded-lg transition-colors"
                    >
                      <QrCode className="w-5 h-5" />
                      Generate QR Code
                    </button>
                  </div>
                </>
              )}
            </div>
        </div>

        {/* Footer */}
        {copiedText && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{copiedText} copied to clipboard!</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrModal && qrCodeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code</h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Scan this QR code to share "{currentProject?.name}"
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `qr-code-${currentProject?.name || 'music'}.png`;
                      link.click();
                    }}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SharePanel;
