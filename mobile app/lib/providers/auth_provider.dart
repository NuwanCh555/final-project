import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Auto-login checking if a persistent token exists
  Future<bool> tryAutoLogin() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      if (!prefs.containsKey('token')) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Fetch user profile using the stored token
      _user = await ApiService.getProfile();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (err) {
      // Token may be invalid or expired
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      _user = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.login(email, password);
      _user = res['user'];
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _user = null;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> register(String name, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.register(name, email, password);
      _user = res['user'];
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      _user = null;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateProfile(String name, String email, String? password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await ApiService.updateProfile(name, email, password);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> uploadProfilePicture(String filePath) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await ApiService.uploadProfilePicture(filePath);
      _isLoading = false;
      notifyListeners();
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _user = null;
    _error = null;
    notifyListeners();
  }

  Future<String> forgotPassword(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final msg = await ApiService.forgotPassword(email);
      _isLoading = false;
      notifyListeners();
      return msg;
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<String> verifyOTP(String email, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final msg = await ApiService.verifyOTP(email, otp);
      _isLoading = false;
      notifyListeners();
      return msg;
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<String> resetPassword(String email, String otp, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final msg = await ApiService.resetPassword(email, otp, password);
      _isLoading = false;
      notifyListeners();
      return msg;
    } catch (err) {
      _error = err.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
}
