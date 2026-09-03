import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Image as ImageIcon, AtSign, AlignLeft, Globe } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur opacity-20 dark:opacity-30"></div>
        <div className="relative bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Public Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Customize how your profile appears to sellers and other users.
            </p>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20">
          <Globe className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Customization</h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-2.5">
              <Label htmlFor="username" className="text-slate-600 dark:text-slate-300">Public Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="username" defaultValue="johndoe26" className="pl-9 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="firstName" className="text-slate-600 dark:text-slate-300">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="firstName" defaultValue="John" className="pl-9 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="lastName" className="text-slate-600 dark:text-slate-300">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="lastName" defaultValue="Doe" className="pl-9 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="bio" className="text-slate-600 dark:text-slate-300">Short Bio</Label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea 
                  id="bio" 
                  rows={4} 
                  defaultValue="Tech enthusiast and frequent shopper. Always looking for the best deals on electronics." 
                  className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm pl-9 pt-2.5 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50 resize-none" 
                />
              </div>
              <p className="text-xs text-slate-500">Brief description for your profile. URLs are hyperlinked.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-slate-600 dark:text-slate-300">Profile Avatar</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group relative overflow-hidden h-48">
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10 rounded-xl">
                  <Button variant="secondary" size="sm" className="pointer-events-none">Change Image</Button>
                </div>
                <div className="h-24 w-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-sm z-0">
                  <User className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 text-xs">Remove Avatar</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5">Save Profile</Button>
        </div>
      </section>
    </div>
  );
}
