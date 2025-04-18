import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/admin-layout";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Loader2, User, ShieldCheck, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default function AdminProfilePage() {
  const { adminUser } = useAdminAuth();
  
  if (!adminUser) {
    return (
      <AdminLayout title="Profile">
        <div className="flex justify-center items-center min-h-[calc(100vh-5rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Profile">
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Admin Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="font-medium">{adminUser.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{adminUser.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{adminUser.role}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Created</p>
                      <p className="font-medium">
                        {format(new Date(adminUser.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {format(new Date(adminUser.updatedAt), "PPP 'at' p")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}