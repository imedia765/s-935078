
import { useProfileManagement } from "@/hooks/useProfileManagement";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { BankDetailsCard } from "@/components/profile/BankDetailsCard"; 
import { PaymentHistoryCard } from "@/components/profile/PaymentHistoryCard";
import { FamilyMembersCard } from "@/components/profile/FamilyMembersCard";
import { AnnouncementsCard } from "@/components/profile/AnnouncementsCard";
import { DocumentsCard } from "@/components/profile/DocumentsCard";
import { FamilyMemberDialogs } from "@/components/profile/FamilyMemberDialogs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const {
    memberData,
    loading,
    error,
    isEditing,
    editedData,
    uploadingPhoto,
    validationErrors,
    saving,
    isAddFamilyMemberOpen,
    isEditFamilyMemberOpen,
    selectedFamilyMember,
    handleInputChange,
    handleSave,
    handleCancel,
    handleEdit,
    handlePhotoUpload,
    setIsAddFamilyMemberOpen,
    setIsEditFamilyMemberOpen,
    fetchData,
    handleAddFamilyMember,
    handleEditFamilyMember,
    handleDeleteFamilyMember,
    handleViewDocument,
    handleDownloadDocument
  } = useProfileManagement();

  const profileCardRef = useRef<HTMLDivElement>(null);
  const bankDetailsRef = useRef<HTMLDivElement>(null);
  const familyMembersRef = useRef<HTMLDivElement>(null);
  const paymentHistoryRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const captureScreenshot = async (elementRef: React.RefObject<HTMLElement>, name: string) => {
    try {
      if (!elementRef.current) return;

      // Use html2canvas (you'll need to install this package)
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(elementRef.current);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/png');
      });

      // Upload to Supabase storage
      const fileName = `${name}_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('profile_screenshots')
        .upload(fileName, blob);

      if (uploadError) {
        throw uploadError;
      }

      toast({
        title: "Screenshot captured",
        description: `Successfully captured screenshot of ${name}`,
      });

    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        variant: "destructive",
        title: "Screenshot failed",
        description: "Failed to capture screenshot",
      });
    }
  };

  // Mock data for announcements and documents
  const announcements = [
    {
      id: '1',
      title: 'System Maintenance',
      content: 'Scheduled maintenance this weekend',
      created_at: new Date().toISOString(),
      priority: 'medium' as const
    }
  ];

  const documents = [
    {
      id: '1',
      title: 'Member Handbook',
      type: 'PDF',
      size: '2.5MB',
      updated_at: new Date().toISOString(),
      url: '#'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
              <div className="h-8 w-48 bg-primary/10 animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ProfileCard
                  memberData={null}
                  editedData={null}
                  isEditing={false}
                  validationErrors={{}}
                  uploadingPhoto={false}
                  saving={false}
                  onPhotoUpload={() => {}}
                  onInputChange={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onEdit={() => {}}
                />
                <PaymentHistoryCard memberData={null} isLoading={true} />
              </div>
              <div className="space-y-6">
                <Card className="p-6 animate-pulse">
                  <div className="h-4 w-3/4 bg-primary/10 rounded mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-primary/5 rounded" />
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-4">Error Loading Profile</h2>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Member Dashboard
            </h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div ref={profileCardRef} className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => captureScreenshot(profileCardRef, 'profile_card')}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <ProfileCard
                  memberData={memberData}
                  editedData={editedData}
                  isEditing={isEditing}
                  validationErrors={validationErrors}
                  uploadingPhoto={uploadingPhoto}
                  saving={saving}
                  onPhotoUpload={handlePhotoUpload}
                  onInputChange={handleInputChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onEdit={handleEdit}
                />
              </div>
              <div ref={bankDetailsRef} className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => captureScreenshot(bankDetailsRef, 'bank_details')}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <BankDetailsCard memberNumber={memberData?.member_number} />
              </div>
              <div ref={familyMembersRef} className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => captureScreenshot(familyMembersRef, 'family_members')}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <FamilyMembersCard
                  memberData={memberData}
                  onAddMember={() => setIsAddFamilyMemberOpen(true)}
                  onEditMember={(member) => {
                    selectedFamilyMember.current = member;
                    setIsEditFamilyMemberOpen(true);
                  }}
                  onDeleteMember={handleDeleteFamilyMember}
                />
              </div>
              <div ref={paymentHistoryRef} className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => captureScreenshot(paymentHistoryRef, 'payment_history')}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <PaymentHistoryCard memberData={memberData} isLoading={false} />
              </div>
            </div>
            <div className="space-y-6">
              <AnnouncementsCard announcements={announcements} />
              <DocumentsCard
                documents={documents}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
              />
            </div>
          </div>
        </div>
      </div>
      <FamilyMemberDialogs
        isAddOpen={isAddFamilyMemberOpen}
        isEditOpen={isEditFamilyMemberOpen}
        selectedFamilyMember={selectedFamilyMember}
        onAddOpenChange={setIsAddFamilyMemberOpen}
        onEditOpenChange={setIsEditFamilyMemberOpen}
        onAddSubmit={handleAddFamilyMember}
        onEditSubmit={handleEditFamilyMember}
      />
    </div>
  );
};

export default Profile;
