"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/ui/Navbar';
import toast from 'react-hot-toast';
import { Camera, User, Mail, Save, Phone, Hash, GraduationCap, Building, Calendar, Edit2, Lock } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  
  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("humi_user");
    if (!userData) {
      router.push('/auth/login');
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    setName(parsed.name || '');
    setEmail(parsed.email || '');
    setPhone(parsed.phone || '');
    setMatricNumber(parsed.matricNumber || '');
    setFaculty(parsed.faculty || '');
    setDepartment(parsed.department || '');
    setLevel(parsed.level || '');
    setImageUrl(parsed.profile_picture_url || '');
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData);
      setImageUrl(res.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user wants to change password
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!currentPassword) {
        toast.error('Current password is required to set a new password');
        return;
      }
    }

    setIsSaving(true);

    try {
      // 1. Update Profile Info
      const res = await api.put('/auth/profile', {
        name,
        phone,
        matricNumber,
        faculty,
        department,
        level,
        profile_picture_url: imageUrl
      });
      
      const updatedUser = res.data.user;
      localStorage.setItem("humi_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("authChange"));
      
      // 2. Update Password if requested
      if (newPassword && currentPassword) {
        await api.put('/auth/password', {
          currentPassword,
          newPassword
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Profile and password updated successfully');
      } else {
        toast.success('Profile updated successfully');
      }
      
      setIsEditing(false); // Switch back to view mode
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset fields to what they were
    setName(user.name || '');
    setPhone(user.phone || '');
    setMatricNumber(user.matricNumber || '');
    setFaculty(user.faculty || '');
    setDepartment(user.department || '');
    setLevel(user.level || '');
    setImageUrl(user.profile_picture_url || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  if (!user) return <div className="min-h-screen pt-24 bg-background"></div>;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6 container mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>
        
        <div className="glass-panel border border-white/10 rounded-3xl p-8">
          {!isEditing ? (
            // ================== READ ONLY VIEW ==================
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col items-center sm:flex-row gap-8">
                <div className="w-32 h-32 rounded-full border-2 border-white/10 overflow-hidden bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-bold mb-1">{name}</h2>
                  <p className="text-text-muted mb-4">{email}</p>
                  
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full border border-primary/30">
                      {user.role}
                    </span>
                    {user.created_at && (
                      <span className="px-3 py-1 bg-surface text-text-muted text-xs font-medium rounded-full border border-white/5 flex items-center gap-1">
                        <Calendar size={12} /> Joined {format(new Date(user.created_at), 'MMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-2"><Phone size={14} /> Phone Number</p>
                  <p className="font-medium">{phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-2"><Hash size={14} /> Matric Number</p>
                  <p className="font-medium">{matricNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-2"><Building size={14} /> Faculty</p>
                  <p className="font-medium">{faculty || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-2"><Building size={14} /> Department</p>
                  <p className="font-medium">{department || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-2"><GraduationCap size={14} /> Level</p>
                  <p className="font-medium">{level || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            // ================== EDIT MODE ==================
            <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center sm:flex-row gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-2 border-white/10 overflow-hidden bg-primary/20 flex items-center justify-center text-primary">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} />
                    )}
                  </div>
                  
                  <label className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                    <Camera size={20} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl font-semibold mb-1">Update Avatar</h3>
                  <p className="text-sm text-text-muted mb-4">Recommended size: 256x256px. Max 2MB.</p>
                  {imageUrl && (
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User size={16} className="text-text-muted" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail size={16} className="text-text-muted" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 opacity-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone size={16} className="text-text-muted" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 08012345678"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash size={16} className="text-text-muted" /> Matric Number
                  </label>
                  <input
                    type="text"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 23012345"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building size={16} className="text-text-muted" /> Faculty
                  </label>
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. Science"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building size={16} className="text-text-muted" /> Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap size={16} className="text-text-muted" /> Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="" className="bg-surface text-white">Select Level</option>
                    <option value="100L" className="bg-surface text-white">100 Level</option>
                    <option value="200L" className="bg-surface text-white">200 Level</option>
                    <option value="300L" className="bg-surface text-white">300 Level</option>
                    <option value="400L" className="bg-surface text-white">400 Level</option>
                    <option value="500L" className="bg-surface text-white">500 Level</option>
                    <option value="Postgraduate" className="bg-surface text-white">Postgraduate</option>
                    <option value="Alumni" className="bg-surface text-white">Alumni</option>
                  </select>
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              {/* Password Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Change Password
                </h3>
                <p className="text-sm text-text-muted mb-4">Leave these fields blank if you do not wish to change your password.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full font-medium transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
