import { Link } from "react-router-dom";
import { ShoppingCart, HelpCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CartDrawer from "@/components/cart/CartDrawer";
import { useNavbar } from "@/hooks/useNavbar";
import { NavLinks } from "@/components/layout/NavLinks";
import { NavSearch } from "@/components/layout/NavSearch";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";

const Navbar = () => {
  const {
    isMenuOpen,
    isSearchOpen,
    loading,
    user,
    isAuthenticated,
    navItems,
    pendingAppointments,
    cartItemCount,
    handleNavClick,
    handleSignOut,
    handleProfileClick,
    toggleMenu,
    openSearch,
    closeSearch,
    navigate,
  } = useNavbar();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Full Vision</h1>
          </Link>

          {/* Desktop Navigation */}
          <NavLinks navItems={navItems} pendingAppointments={pendingAppointments} onNavClick={handleNavClick} />

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <NavSearch isOpen={isSearchOpen} onOpen={openSearch} onClose={closeSearch} />
            </div>

            {/* Cart */}
            <Tooltip>
              <TooltipTrigger asChild>
                <CartDrawer>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <ShoppingCart className="h-4 w-4" />
                    {cartItemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center p-0"
                      >
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </CartDrawer>
              </TooltipTrigger>
              <TooltipContent>
                <p>Carrito {cartItemCount > 0 ? `(${cartItemCount})` : ""}</p>
              </TooltipContent>
            </Tooltip>

            {/* Help */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Profile / User Menu */}
            <UserMenu
              user={user}
              isAuthenticated={isAuthenticated}
              loading={loading}
              pendingAppointments={pendingAppointments}
              onProfileClick={handleProfileClick}
              onSignOut={handleSignOut}
              onNavigate={navigate}
            />

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMenuOpen}
          navItems={navItems}
          user={user}
          isAuthenticated={isAuthenticated}
          pendingAppointments={pendingAppointments}
          cartItemCount={cartItemCount}
          onNavClick={handleNavClick}
          onProfileClick={handleProfileClick}
          onSignOut={handleSignOut}
          onNavigate={navigate}
        />
      </div>
    </nav>
  );
};

export default Navbar;
