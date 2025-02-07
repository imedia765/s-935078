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
    announcements,
    documents,
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Member Dashboard
            </h1>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Member Info */}
            <div className="lg:col-span-2 space-y-6">
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

              <BankDetailsCard memberNumber={memberData?.member_number} />
              
              <FamilyMembersCard
                memberData={memberData}
                onAddMember={() => setIsAddFamilyMemberOpen(true)}
                onEditMember={(member) => {
                  selectedFamilyMember.current = member;
                  setIsEditFamilyMemberOpen(true);
                }}
                onDeleteMember={handleDeleteFamilyMember}
              />

              <PaymentHistoryCard memberData={memberData} isLoading={false} />
            </div>

            {/* Right Column - Announcements & Documents */}
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
