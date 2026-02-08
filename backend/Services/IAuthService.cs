using BigDataApp.Api.Models;

namespace BigDataApp.Api.Services;

public interface IAuthService
{
    LoginResponse? Login(LoginRequest request);
}
