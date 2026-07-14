import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';
import '../models/user_model.dart';
import '../models/category_model.dart';
import '../models/transaction_model.dart';
import '../models/budget_model.dart';

class ApiService {
  static final String _baseUrl = AppConfig.baseUrl;

  // Private helper to get default headers with JWT token included if available
  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Handle standard response checking and exception throwing
  static void _checkResponse(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      String errorMessage = 'Request failed with status ${response.statusCode}';
      try {
        final body = jsonDecode(response.body);
        if (body != null && body['error'] != null) {
          errorMessage = body['error'];
        } else if (body != null && body['message'] != null) {
          errorMessage = body['message'];
        }
      } catch (_) {}
      throw Exception(errorMessage);
    }
  }

  // ==========================================
  // AUTHENTICATION SERVICES
  // ==========================================

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);

    // Save JWT token in SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    if (data['token'] != null) {
      await prefs.setString('token', data['token']);
    }

    return {
      'user': UserModel.fromJson(data['user']),
      'token': data['token'],
    };
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);

    // Save JWT token in SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    if (data['token'] != null) {
      await prefs.setString('token', data['token']);
    }

    return {
      'user': UserModel.fromJson(data['user']),
      'token': data['token'],
    };
  }

  static Future<UserModel> getProfile() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/auth/profile'),
      headers: headers,
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return UserModel.fromJson(data['user'] ?? data);
  }

  static Future<UserModel> updateProfile(String name, String email, String? password) async {
    final headers = await _getHeaders();
    final bodyData = {
      'name': name,
      'email': email,
      if (password != null && password.isNotEmpty) 'password': password,
    };

    final response = await http.put(
      Uri.parse('$_baseUrl/auth/profile'),
      headers: headers,
      body: jsonEncode(bodyData),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return UserModel.fromJson(data['user'] ?? data);
  }

  static Future<UserModel> uploadProfilePicture(String filePath) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    var request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/auth/profile-picture'));
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    request.files.add(await http.MultipartFile.fromPath('image', filePath));
    
    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);
    
    _checkResponse(response);
    final data = jsonDecode(response.body);
    return UserModel.fromJson(data['user'] ?? data);
  }

  static Future<String> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/forgotpassword'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return data['message'] ?? 'OTP sent to email';
  }

  static Future<String> verifyOTP(String email, String otp) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/verifyotp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'otp': otp}),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return data['message'] ?? 'OTP verified successfully';
  }

  static Future<String> resetPassword(String email, String otp, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/resetpassword'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'otp': otp, 'password': password}),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return data['message'] ?? 'Password reset successfully';
  }

  // ==========================================
  // CATEGORIES SERVICES
  // ==========================================

  static Future<List<CategoryModel>> getCategories() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/categories'),
      headers: headers,
    );

    _checkResponse(response);
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => CategoryModel.fromJson(json)).toList();
  }

  static Future<CategoryModel> createCategory(
    String name,
    String type,
    String color,
    String icon,
  ) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$_baseUrl/categories'),
      headers: headers,
      body: jsonEncode({
        'name': name,
        'type': type,
        'color': color,
        'icon': icon,
      }),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return CategoryModel.fromJson(data);
  }

  static Future<void> deleteCategory(String id) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$_baseUrl/categories/$id'),
      headers: headers,
    );

    _checkResponse(response);
  }

  // ==========================================
  // TRANSACTIONS SERVICES
  // ==========================================

  static Future<List<TransactionModel>> getTransactions([Map<String, String>? filters]) async {
    final headers = await _getHeaders();
    Uri uri = Uri.parse('$_baseUrl/transactions');
    if (filters != null && filters.isNotEmpty) {
      uri = uri.replace(queryParameters: filters);
    }

    final response = await http.get(uri, headers: headers);
    _checkResponse(response);
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => TransactionModel.fromJson(json)).toList();
  }

  static Future<TransactionModel> createTransaction({
    required double amount,
    required String type,
    required String categoryId,
    required DateTime date,
    String? description,
    String? paymentMethod,
    String? notes,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$_baseUrl/transactions'),
      headers: headers,
      body: jsonEncode({
        'amount': amount,
        'type': type,
        'category': categoryId,
        'date': date.toIso8601String(),
        'description': description ?? '',
        'paymentMethod': paymentMethod ?? 'Cash',
        'notes': notes ?? '',
      }),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return TransactionModel.fromJson(data);
  }

  static Future<TransactionModel> updateTransaction(
    String id,
    Map<String, dynamic> updateData,
  ) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$_baseUrl/transactions/$id'),
      headers: headers,
      body: jsonEncode(updateData),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return TransactionModel.fromJson(data);
  }

  static Future<void> deleteTransaction(String id) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$_baseUrl/transactions/$id'),
      headers: headers,
    );

    _checkResponse(response);
  }

  // ==========================================
  // BUDGETS SERVICES
  // ==========================================

  static Future<List<BudgetModel>> getBudgets(int month, int year) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/budgets?month=$month&year=$year'),
      headers: headers,
    );

    _checkResponse(response);
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => BudgetModel.fromJson(json)).toList();
  }

  static Future<BudgetModel> createOrUpdateBudget({
    required String categoryId,
    required double limit,
    required double warningThreshold,
    required double criticalThreshold,
    required int month,
    required int year,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$_baseUrl/budgets'),
      headers: headers,
      body: jsonEncode({
        'category': categoryId,
        'limit': limit,
        'warningThreshold': warningThreshold,
        'criticalThreshold': criticalThreshold,
        'month': month,
        'year': year,
      }),
    );

    _checkResponse(response);
    final data = jsonDecode(response.body);
    return BudgetModel.fromJson(data);
  }

  static Future<void> deleteBudget(String id) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$_baseUrl/budgets/$id'),
      headers: headers,
    );

    _checkResponse(response);
  }
}
