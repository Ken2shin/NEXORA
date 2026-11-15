import { isSupabaseConfigured } from './supabase'
import type { IAuthRepository } from './contracts/auth.repository'
import type { IServiceRepository } from './contracts/service.repository'
import type { IRequestRepository } from './contracts/request.repository'
import type { IClientRepository } from './contracts/client.repository'
import type { INotificationRepository } from './contracts/notification.repository'
import type { IDashboardRepository } from './contracts/dashboard.repository'

import { MockAuthRepository } from './adapters/mock/mock.auth.repository'
import { MockServiceRepository } from './adapters/mock/mock.service.repository'
import { MockRequestRepository } from './adapters/mock/mock.request.repository'
import { MockClientRepository } from './adapters/mock/mock.client.repository'
import { MockNotificationRepository } from './adapters/mock/mock.notification.repository'
import { MockDashboardRepository } from './adapters/mock/mock.dashboard.repository'

import { SupabaseAuthRepository } from './adapters/supabase/supabase.auth.repository'
import { SupabaseServiceRepository } from './adapters/supabase/supabase.service.repository'
import { SupabaseRequestRepository } from './adapters/supabase/supabase.request.repository'
import { SupabaseClientRepository } from './adapters/supabase/supabase.client.repository'
import { SupabaseNotificationRepository } from './adapters/supabase/supabase.notification.repository'
import { SupabaseDashboardRepository } from './adapters/supabase/supabase.dashboard.repository'

class RepositoryProvider {
  private static instance: RepositoryProvider

  public readonly auth: IAuthRepository
  public readonly services: IServiceRepository
  public readonly requests: IRequestRepository
  public readonly clients: IClientRepository
  public readonly notifications: INotificationRepository
  public readonly dashboard: IDashboardRepository
  public readonly isRealDatabase: boolean

  private constructor() {
    this.isRealDatabase = isSupabaseConfigured()

    if (this.isRealDatabase) {
      this.auth = new SupabaseAuthRepository()
      this.services = new SupabaseServiceRepository()
      this.requests = new SupabaseRequestRepository()
      this.clients = new SupabaseClientRepository()
      this.notifications = new SupabaseNotificationRepository()
      this.dashboard = new SupabaseDashboardRepository()
    } else {
      this.auth = new MockAuthRepository()
      this.services = new MockServiceRepository()
      this.requests = new MockRequestRepository()
      this.clients = new MockClientRepository()
      this.notifications = new MockNotificationRepository()
      this.dashboard = new MockDashboardRepository()
    }
  }

  public static getInstance(): RepositoryProvider {
    if (!RepositoryProvider.instance) {
      RepositoryProvider.instance = new RepositoryProvider()
    }
    return RepositoryProvider.instance
  }
}

export const repositories = RepositoryProvider.getInstance()
